var site = {};
var exports = module.exports = site;

var api = require('./api');
var globalFunctions = require('../../global-functions');
var log = require('../../log');
var smtp = require('./smtp');
var redis = require('../../redisclient');
var config = require('../../config');
var rss = require('./rss');

var _ = require("underscore");
var async = require('async');
var nimble = require('nimble');
var fs = require('fs');
var dateFormat = require('dateformat');

var asereje = require('asereje');

var LAYOUT_GROUPS = null;

var homeModel = JSON.parse(fs.readFileSync("sample-data/frontpage.json"));
var newsModel = JSON.parse(fs.readFileSync("sample-data/news.json"));
var sportsModel = JSON.parse(fs.readFileSync("sample-data/sports.json"));

// TODO remove and put in to api
var db = require('../../db-abstract');

var BENCHMARK = false;

function _convertTimestamp(timestamp) {
    var date = new Date(timestamp*1000);
    return dateFormat(date,"mmmm dS, yyyy");
}

function _articleViewsKey(taxonomy) {
    return "article_views:" + config.get("COUCHDB_URL") + ":" + config.get("COUCHDB_DATABASE") + ":" + JSON.stringify(taxonomy);
}

site.init = function (app, callback) {
    var twitterFeeds = ["DukeChronicle", "ChronicleRecess", "TowerviewMag", "DukeBasketball", "ChronPhoto", "ChronicleSports"];
    LAYOUT_GROUPS = config.get("LAYOUT_GROUPS");

    api.init(function (err2) {
        if (err2) {
            log.crit("api init failed!");
            return callback(err2);
        }

        app.get('/about-us', function (req, res) {
            res.render('pages/about-us', {filename:'pages/about-us'});
        });

        app.get('/privacy-policy', function (req, res) {
            res.render('pages/privacy-policy', {filename:'pages/privacy-policy'});
        });

        app.get('/user-guidelines', function (req, res) {
            res.render('pages/user-guidelines', {filename:'pages/user-guidelines'});
        });

        app.get('/advertising', function (req, res) {
            res.render('pages/advertising', {filename:'pages/advertising'});
        });

        app.get('/subscribe', function (req, res) {
            res.render('pages/subscribe', {filename:'pages/subscribe'});
        });

        app.get('/edit-board', function (req, res) {
            res.render('pages/edit-board', {filename:'pages/edit-board'});
        });

        app.get('/letters-to-the-editor', function (req, res) {
            res.render('pages/letters', {filename:'pages/letters'});
        });

        app.get('/contact', function (req, res) {
            res.render('pages/contact', {filename:'pages/contact'});
        });


        app.get('/', function (req, res) {
            var start = Date.now();
            async.parallel([
                function (callback) { //0
                    api.group.docs(LAYOUT_GROUPS.Frontpage.namespace, null, function (err, result) {
                        if (err) return callback(err);
                        if (BENCHMARK) log.info("API TIME %d", Date.now() - start);
                        return callback(null, result);
                    });
                },
                function (callback) { //1
                    var popularArticles = 7;
                    redis.client.zrevrange(_articleViewsKey([]), 0, popularArticles - 1, function (err, popular) {
                        if (err) return callback(err);
                        popular = popular.map(function (str) {
                            var parts = str.split('||');
                            return {
                                url:'/article/' + parts[0],
                                title:parts[1]
                            };
                        });
                        if (BENCHMARK) log.info("REDIS TIME %d", Date.now() - start);
                        callback(null, popular);
                    });
                },
                function (callback) { //2
                    var twitter = {};
                    var selectedFeed = twitterFeeds[Math.floor(Math.random() * twitterFeeds.length)];
                    twitter.user = selectedFeed;
                    twitter.title = 'Twitter';
                    twitter.imageUrl = "/images/twitter-dukechronicle.png";
                    rss.getRSS('twitter-' + selectedFeed, function (err, tweets) {
                        if (tweets && tweets.items && tweets.items.length > 0) {
                            twitter.tweet = tweets.items[0].title;
                        } else {
                            twitter.tweet = 'No tweets available.';
                        }
                        if (BENCHMARK) log.info("RSS TIME %d", Date.now() - start);
                        return callback(err, twitter);
                    });
                }
            ],
                    function (err, results) {
                        if (BENCHMARK) log.info("TOTAL TIME %d", Date.now() - start);
                        var model = results[0];
                        _.defaults(model, homeModel);

                        model.popular = results[1];
                        model.twitter = results[2];
                        res.render('site/index', {
                            css:asereje.css(['slideshow/style', 'container/style', 'site/frontpage']),
                            layout:'layout-optimized',
                            filename:'views/site/index.jade',
                            locals:{
                                model:model
                            }
                        });

                    });
        });

        app.get('/news', function (req, res) {
            api.group.docs(LAYOUT_GROUPS.News.namespace, null, function (err, model) {
                _.defaults(model, newsModel);
                redis.client.zrevrange(_articleViewsKey(['News']), 0, 5, function (err, popular) {
                    model.popular = popular.map(function (str) {
                        var parts = str.split('||');
                        return {
                            url:'/article/' + parts[0],
                            title:parts[1]
                        };
                    });
                    rss.getRSS('newsblog', function (err, rss) {
                        if (rss && rss.items && rss.items.length > 0) {
                            model.Blog = rss.items.map(function (item) {
                                item.url = item.link;
                                item.title = item.title.replace(/\&#8217;/g, '’');
                                delete item.link;
                                return item;
                            });
                            model.Blog.splice(6, model.Blog.length - 6);
                        }

                        model.adFullRectangle = {
                            "title":"Advertisement",
                            "imageUrl":"/images/ads/monster.png",
                            "url":"http://google.com",
                            "width":"300px",
                            "height":"250px"
                        };

                        api.taxonomy.getParentAndChildren(['News'], function (err, parentAndChildren) {
                            res.render('site/news', {
                                css:asereje.css(['container/style', 'site/section', 'site/news']),
                                layout:'layout-optimized',
                                subsections:parentAndChildren.children,
                                filename:'views/site/news.jade',
                                model:model
                            });
                        });
                    });
                });
            });
        });

        app.get('/sports', function (req, httpRes) {
            api.group.docs(LAYOUT_GROUPS.Sports.namespace, null, function (err, model) {
                _.defaults(model, sportsModel);

                async.parallel([
                    function (callback) { //0
                        rss.getRSS('sportsblog', function (err, res) {
                            if (res && res.items && res.items.length > 0) {
                                var Blog = res.items.map(function (item) {
                                    item.url = item.link;
                                    item.title = item.title.replace(/\&#8217;/g, '’');
                                    delete item.link;
                                    return item;
                                });
                                Blog.splice(5, Blog.length - 5);
                                callback(null, Blog)
                            } else {
                                callback(null, []);
                            }
                        });
                    },
                    function (callback) { //1
                        api.taxonomy.getParentAndChildren(['Sports', 'Men'], callback);
                    },
                    function (callback) { //2
                        api.taxonomy.getParentAndChildren(['Sports', 'Women'], callback);
                    },
                    function (callback) { //3
                        api.taxonomy.docs("Football", 4, callback);
                    },
                    function (callback) { //4
                        api.taxonomy.docs("M Basketball", 4, callback);
                    },
                    function (callback) { //5
                        api.taxonomy.docs("M Soccer", 4, callback);
                    },
                    function (callback) { //6
                        api.taxonomy.docs("W Soccer", 4, callback);
                    }
                ],
                        // optional callback
                        function (err, results) {
                            if (err) return log.warning(err);
                            model.Blog = results[0];
                            /*
                             model.Football = _.pluck(results[3], 'value');
                             model.Mbball = _.pluck(results[4], 'value');
                             model.MSoccer = _.pluck(results[5], 'value');
                             model.WSoccer = _.pluck(results[6], 'value');*/

                            model.adFullRectangle = {
                                "title":"Advertisement",
                                "imageUrl":"/images/ads/monster.png",
                                "url":"http://google.com",
                                "width":"300px",
                                "height":"250px"
                            };


                            //log.debug(model.WSoccer);
                            httpRes.render('site/sports', {
                                css:asereje.css(['container/style', 'site/section', 'site/sports', 'slideshow/style']),
                                layout:'layout-optimized',
                                subsections:[results[1].children, results[2].children],
                                filename:'views/site/sports.jade',
                                model:model});
                        });

            });
        });

        app.get('/opinion', function (req, res) {
            var columnists = [

                {name:"Abdullah Antepli", year:"Facutly", tagline:"the land of delights and wonders", day: "Tuesday"},
                {name:"Darren Beattie", year:"Ph.D. Candidate", tagline:"oy weber", day: "Monday"},
                {name:"Priya Bhat", year:"Trinity 2011", tagline:"life as ms. b.", day: "Thursday", twitter:"tbpriya"},
                {name:"Elena Botella", year:"Trinity 2013", tagline:"duke's biggest party", day: "Monday", twitter:"dukedemocrats"},
                {name:"Scott Briggs", year:"Trinity 2014", tagline:"as i see it", day: "Wednesday"},
                {name:"Ellie Bullard", year:"Trinity 2013", tagline:"", day: "Wednesday"},
                {name:"Ashley Camano", year:"Trinity 2014", tagline:"going camando", day: "Tuesday"},
                {name:"Rajlakshmi De", year:"Trinity 2013", tagline:"minority report", day: "Friday", twitter:"RajDe4"},
                {name:"Scott Dobbie", year:"Trinity 2013", tagline:"the variable", day: "Friday"},
                {name:"dPS (Sanjay Kishore)", year:"Trinity 2014", tagline:"think globally, act locally", day: "Tuesday", twitter: "dukePS"},
                {name:"Caleb Duncanson", year:"Pratt 2012", tagline:"news flash", day: "Friday"},
                {name:"Amanda Garfinkel", year:"Trinity 2013", tagline:"the devil doesn't wear prada", day: "Tuesday"},
                {name:"Roshni Jain", year:"Trinity 2015", tagline:"muddled and befuddled", day: "Thursday"},
                {name:"Ahmad Jitan", year:"Trinity 2013", tagline:"indecent family man", day: "Thursday"},
                {name:"Sam Lachman", year:"Trinity 2013", tagline:"what's our age again?", day: "Thursday", twitter:"SamLachman"},
                {name:"Kristen Lee", year:"Trinity 2013", tagline:"between worlds", day: "Monday"},
                {name:"Mia Lehrer", year:"Trinity 2012", tagline:"but actually", day: "Thursday"},
                {name:"Harry Liberman", year:"Trinity 2013", tagline:"", day: "Friday"},
                {name:"Monday Monday", year:"Undergrad", tagline:"the devil", day: "Friday"},
                {name:"Tegan Joseph Mosugu", year:"Trinity 2014", tagline:"be fierce, be real", day: "Friday", twitter:"tjcaliboy"},
                {name:"Indu Ramesh", year:"Trinity 2013", tagline:"walk the walk, talk the talk", day: "Friday"},
                {name:"Sonul Rao", year:"Trinity 2013", tagline:"that's what she said", day: "Tuesday"},
                {name:"Lillie Reed", year:"Trinity 2014", tagline:"wumbology", day: "Wednesday"},
                {name:"Jeremy Ruch", year:"Trinity 2013", tagline:"run and tell that", day: "Wednesday"},
                {name:"Antonio Segalini", year:"Trinity 2013", tagline:"musings", day: "Monday"},
                {name:"Travis Smith", year:"Trinity 2013", tagline:"It’s all in the game", day: "Thursday"},
                {name:"Connor Southard", year:"Trinity 2012", tagline:"dead poet", day: "Wednesday"},
                {name:"Lindsay Tomson", year:"Trinity 2012", tagline:"middle child syndrome", day: "Wednesday", twitter:"elle4tee"},
                    /*
                {name:"Connor Southard", year:"Trinity 2012"},
                {name:"Sony Rao", year:"Trinity 2013"},
                {name:"Elena Botella", year:"Trinity 2012"},
                {name:"William Reach", year:"Trinity 2012"},
                {name:"Darren Beattie", year:"Trinity 2012"},
                {name:"Indu Ramesh", year:"Trinity 2012"},
                {name:"Rui Dai", year:"Trinity 2012"},
                {name:"Monday Monday", year:"Trinity 2012"},
                {name:"Abdullah Antepli", year:"Trinity 2012"},
                {name:"Connel Fullenkamp", year:"Trinity 2012"},
                {name:"Leilani Doktor", year:"Trinity 2012"},
                {name:"Milap Mehta", year:"Trinity 2012"},
//                {name:"Sonia Havale", year:"Trinity 2012"},
                {name:"Ahmad Jitan", year:"Trinity 2012"},
                {name:"Daniel Strunk", year:"Trinity 2012"},
                {name:"Antonio Segalini", year:"Trinity 2012"},
                {name:"Jeremy Ruch", year:"Trinity 2012"},
                {name:"Maggie LaFalce", year:"Trinity 2012"},
                {name:"Jessica Kim", year:"Trinity 2012"},
                {name:"Josh Brewer", year:"Trinity 2012"},
                {name:"Travis Smith", year:"Trinity 2012"},
                {name:"William Weir", year:"Trinity 2012"},
                {name:"Liz Bloomhardt", year:"Trinity 2012"},
                {name:"Scott Briggs", year:"Trinity 2012"},
//                {name:"Mike Goodrich", year:"Trinity 2012"},
                {name:"Amanda Garfinkel", year:"Trinity 2012"},
                {name:"Tegan Joseph Mosugu", year:"Trinity 2012"}*/
            ];

            async.parallel([
                function (callback) { //0
                    api.group.docs(LAYOUT_GROUPS.Opinion.namespace, null, callback);
                },
                function (callback) { //1
                    api.taxonomy.getParentAndChildren(['Opinion'], callback);
                },
                function (callback) { //2
                    rss.getRSS('blog-opinion', function (err, res) {
                        if (res && res.items && res.items.length > 0) {
                            var Blog = res.items.map(function (item) {
                                item.url = item.link;
                                item.title = item.title.replace(/\&#8217;/g, '’');
                                delete item.link;
                                return item;
                            });
                            Blog.splice(5, Blog.length - 5);
                            callback(null, Blog)
                        } else {
                            callback(null, []);
                        }
                    });
                },
                function (callback) { // 3
                    api.authors.getLatest("Editorial Board", "Opinion", 5, callback);
                },
                function (callback) { //4
                    async.map(columnists,
                            function(columnist, _callback) {
                                api.authors.getLatest(columnist.name, "Opinion", 5, function(err, res) {
                                    columnist.stories = res;
                                    _callback(err, columnist);
                                })
                            },
                            callback
                    );
                }
            ],
            function (err, results) {
                var model = results[0];
                model.Featured.forEach(function(article) {
                    article.author = article.authors[0];
                });
                model.Blog = results[2];
                model.EditorialBoard = results[3];
                model.Columnists = {};
                // assign each columnist an object containing name and stories to make output jade easier
                results[4].forEach(function(columnist, index) {
                        model.Columnists[index] = columnist;
                });
                // need to call compact to remove undefined entries in array
                _.compact(model.Columnists);
                model.adFullRectangle = {
                    "title":"Advertisement",
                    "imageUrl":"/images/ads/monster.png",
                    "url":"http://google.com",
                    "width":"300px",
                    "height":"250px"
                };

                model.adFullBanner = {
                    "title":"Ad",
                    "imageUrl":"/images/ads/full-banner.jpg",
                    "url":"http://google.com",
                    "width":"468px",
                    "height":"60px"
                };

                res.render('site/opinion', {
                    css:asereje.css(['container/style', 'site/section', 'site/opinion']),
                    layout:'layout-optimized',
                    subsections:results[1].children,
                    filename:'views/site/opinion.jade',
                    model:model});
            });

        });

        app.get('/recess', function (req, res) {
            api.group.docs(LAYOUT_GROUPS.Recess.namespace, null, function (err, result) {

                rss.getRSS('recessblog', function (err, rss) {
                    if (rss && rss.items && rss.items.length > 0) {
                        result.Blog = rss.items.map(function (item) {
                            item.url = item.link;
                            item.title = item.title.replace(/\&#8217;/g, '’');
                            delete item.link;
                            return item;
                        });
                        result.Blog.splice(3, result.Blog.length - 3);
                    }

                    result.adMedRectangle = {
                        "title":"Advertisement",
                        "imageUrl":"https://www.google.com/help/hc/images/adsense_185665_adformat-text_250x250.png",
                        "url":"http://google.com",
                        "width":"250px",
                        "height":"250px"
                    };


                    api.taxonomy.getParentAndChildren(['Recess'], function (err, parentAndChildren) {
                        res.render('site/recess', {
                            css:asereje.css(['container/style', 'site/section', 'site/recess']),
                            layout:'layout-optimized',
                            subsections:parentAndChildren.children,
                            filename:'views/site/recess.jade',
                            model:result});
                    });
                })
            });
        });

        app.get('/towerview', function (req, res) {
            api.group.docs(LAYOUT_GROUPS.Towerview.namespace, null, function (err, result) {

                result.adFullRectangle = {
                    "title":"Advertisement",
                    "imageUrl":"/images/ads/monster.png",
                    "url":"http://google.com",
                    "width":"300px",
                    "height":"250px"
                };

                api.taxonomy.getParentAndChildren(['Towerview'], function (err, parentAndChildren) {
                    res.render('site/towerview', {
                        css:asereje.css(['container/style', 'site/section', 'site/towerview']),
                        layout:'layout-optimized',
                        subsections:parentAndChildren.children,
                        filename:'views/site/towerview.jade',
                        model:result});
                });
            });
        });

        app.get('/section/*', function (req, res) {
            var params = req.params.toString().split('/');
            var section = params[params.length - 1];
            api.taxonomy.docs(section, 20,
                    function (err, docs) {
                        if (err) globalFunctions.showError(res, err);
                        else {
                            docs = docs.map(function (doc) {
                                if (doc.urls) return doc;
                            });
                            docs.forEach(function (doc) {
                                doc.url = '/article/' + doc.urls[doc.urls.length - 1];
                                // convert timestamp
                                if (doc.created) {
                                    doc.date = _convertTimestamp(doc.created);
                                }
                                doc = _parseAuthor(doc);
                            });

                            api.taxonomy.getParentAndChildren(params, function (err, parentAndChildren) {
                                res.render('site/section', {
                                    locals:{
                                        docs:docs,
                                        subsections:parentAndChildren.children,
                                        parentPaths:parentAndChildren.parentPaths,
                                        section:section
                                    },
                                    layout: "layout-optimized",
                                    css:asereje.css(['container/style', 'site/section'])
                                });
                            });
                        }
                    }
            );
        });
        
        /**
            Site Search. Pretties up URL
        */
        app.get('/search', function (req, http_res) {
            var query = "--";            
            if (req.param('search') != null) query = req.param('search').replace(/ /g, '-'); // replace spaces with dashes for readibility

            http_res.redirect('/search/' + query + '?sort=relevance&order=desc'); 
        });

        /**
            Calls Search Functionality
        */
        app.get('/search/:query', function (req, http_res) {
            api.search.docsBySearchQuery(req.params.query.replace(/-/g, ' '), req.query.sort, req.query.order, req.query.facets, 1, function (err, docs, facets) {
                _showSearchArticles(err, req, http_res, docs, facets);
            });
        });

        app.get('/staff/:query', function (req, http_res) {
            var name = req.params.query.replace(/-/g, ' ');

            api.search.docsByAuthor(name, 'desc', '', 1, function (err, docs) {
                if (err) return globalFunctions.showError(http_res, err);

                docs.forEach(function (doc) {
                    if (doc.urls != null) doc.url = '/article/' + doc.urls[doc.urls.length - 1];
                    else doc.url = '/';

                    // convert timestamp
                    if (doc.created) {
                        doc.date = _convertTimestamp(doc.created);
                    }
                    doc = _parseAuthor(doc);
                });

			    http_res.render('site/people',
                {
                    locals:{
                        docs: docs,
                        name: globalFunctions.capitalizeWords(name)
                    },
                    layout: "layout-optimized",
                    css:asereje.css(['container/style', 'site/people'])
                });
            });
        });

        app.get('/page/:url', function (req, http_res) {
            var url = req.params.url;

            api.nodeForTitle(url, function (err, doc) {
                if (err) {
                    globalFunctions.showError(http_res, err);
                }
                else {
                    doc.fullUrl = "http://dukechronicle.com/page/" + url;
                    doc.path = "/page/" + url;
                    http_res.render('page', {
                        locals:{
                            doc:doc,
                            model:{
                                "adFullRectangle":{
                                    "title":"Advertisement",
                                    "imageUrl":"/images/ads/monster.png",
                                    "url":"http://google.com",
                                    "width":"300px",
                                    "height":"250px"
                                }
                            }
                        },
                        filename:'views/page.jade'
                    });
                }
            })
        });

        app.get('/article/:url', function (req, http_res) {
            var url = req.params.url;
            api.articleForUrl(url, function (err, doc) {
                if (err) {
                    return globalFunctions.showError(http_res, err);
                }
                else {
                    // convert timestamp
                    if (doc.created) {
                        doc.date = _convertTimestamp(doc.created);
                    }

                    doc = _parseAuthor(doc);

                    var latestUrl = doc.urls[doc.urls.length - 1];

                    if (url !== latestUrl) {
                        http_res.redirect('/article/' + latestUrl);
                    }
                    else {
                        doc.fullUrl = "http://dukechronicle.com/article/" + latestUrl;
                        doc.url = latestUrl;

                        doc.path = "/article/" + latestUrl;

                        var isAdmin = api.accounts.isAdmin(req);

                        http_res.render('article', {
                            locals:{
                                doc:doc,
                                isAdmin:isAdmin,
                                model:{
                                    "adFullRectangle":{
                                        "title":"Advertisement",
                                        "imageUrl":"/images/ads/monster.png",
                                        "url":"http://google.com",
                                        "width":"300px",
                                        "height":"250px"
                                    }
                                }
                            },
                            filename:'views/article.jade',
                            css:asereje.css(['container/style', 'article']),
                            layout:'layout-optimized'
                        });
                    }

                    if (doc.taxonomy) {
                        var length = doc.taxonomy.length;
                        var taxToSend = doc.taxonomy;
                        var multi = redis.client.multi();
                        for (var i = length; i >= 0; i--) {
                            taxToSend.splice(i, 1);
                            multi.zincrby(_articleViewsKey(doc.taxonomy), 1, latestUrl + "||" + doc.title);
                        }
                        multi.exec(function (err, res) {
                            if (err) {
                                log.warning("Failed to register article view: " + latestUrl);
                                log.warning(err);
                            }
                        });
                    }
                }
            });
        });

        app.get('/page/:url', function (req, http_res) {
            var url = req.params.url;

            api.docForUrl(url, function (err, doc) {
                if (err) return globalFunctions.showError(http_res, err);
                else {
                    var latestUrl = doc.urls[doc.urls.length - 1];

                    if (url !== latestUrl) {
                        http_res.redirect('/page/' + latestUrl);
                    }
                    else {
                        http_res.render('page', {
                            locals:{
                                doc:doc
                            },
                            filename:'views/page.jade'
                        });
                    }
                }
            });
        });

        app.get('/article/:url/print', function (req, http_res) {
            var url = req.params.url;

            api.articleForUrl(url, function (err, doc) {
                if (err) {
                    globalFunctions.showError(http_res, err);
                }
                else {
                    // convert timestamp
                    if (doc.created) {
                        doc.date = _convertTimestamp(doc.created);
                    }

                    doc = _parseAuthor(doc);

                    var latestUrl = doc.urls[doc.urls.length - 1];

                    if (url !== latestUrl) {
                        http_res.redirect('/article/' + latestUrl + '/print');
                    }
                    else {
                        doc.fullUrl = "http://dukechronicle.com/article/" + latestUrl;
                        http_res.render('article-print', {
                            locals:{
                                doc:doc
                            },
                            filename:'views/article-print.jade',
                            layout:"layout-print.jade"
                        });
                    }
                }
            });
        });

        app.get('/article/:url/edit', site.checkAdmin, site.renderArticleEdit = function (req, http_res) {

            var url = req.params.url;

            api.articleForUrl(url, function (err, doc) {
                if (err) {
                    globalFunctions.showError(http_res, err);
                }
                else {
                    if (req.query.deleteImage) {
                        var newImages = doc.images;
                        delete newImages[req.query.deleteImage];
                        api.editDoc(doc._id, newImages, function (editErr) {
                            if (editErr) globalFunctions.showError(http_res, editErr);
                            else http_res.redirect('/article/' + url + '/edit');
                        });
                    }
                    else {

                        var rootSections = config.get("TAXONOMY_MAIN_SECTIONS");

                        db.taxonomy.getTaxonomyListing(function (err, taxonomy) {
                            if (!doc.images) doc.images = {};
                            if (doc.authors) {
                                doc.authors = doc.authors.join(", ");
                            }

                            http_res.render('admin/edit', {
                                locals:{
                                    doc:doc,
                                    groups:[],
                                    images:doc.images,
                                    url:url,
                                    taxonomy:taxonomy
                                },
                                layout:"layout-admin.jade"
                            });

                        });
                    }
                }
            });
        });

        app.get('/page/:url/edit', site.checkAdmin, site.renderPageEdit = function (req, http_res) {
            var url = req.params.url;

            api.docForUrl(url, function (err, doc) {
                if (err) {
                    globalFunctions.showError(http_res, err);
                }
                else {
                    http_res.render('admin/editPage', {
                        locals:{
                            doc:doc
                        },
                        layout:"layout-admin.jade"
                    });
                }
            });
        });

        app.get('/login', function (req, res) {
            site.askForLogin(res, '/');
        });

        app.get('/smtp', function (req, http_res) {
            http_res.render('smtp', {layout:false, model:[""] });
        });

        app.get('/newsletter', function (req, http_res) {
            http_res.render('site/newsletter');
        });

        // eventually sending of newsletter should be put in a cron job, or very least at a url behind /admin/
        app.get('/send-newsletter', function (req, http_res) {
            api.newsletter.createNewsletter(function() {
                api.newsletter.sendNewsletter(function() {});  
            });
          
            http_res.render('site/newsletter');
        });

        app.post('/newsletter', function (req, http_res) {
            var email = req.body.email;
            var action = req.body.action;

            var afterFunc = function() {
                http_res.render('site/newsletter', {
                    email: email,
                    action: action
                });
            };

            if(action == "subscribe") {
                api.newsletter.addSubscriber(email, afterFunc);
            }
            else if(action == "unsubscribe") {
                api.newsletter.removeSubscriber(email, afterFunc);
            }
            else {
                afterFunc();
            }
        });

        app.get('/mu-7843c2b9-3b9490d6-8f535259-e645b756', function (req, http_res) {
            http_res.send('42');
        });

        callback(null);
    });
};

// Checks if you are an admin
site.checkAdmin = function (req, res, next) {
    //if not admin, require login
    if (!api.accounts.isAdmin(req)) {
        site.askForLogin(res, req.url);
    }
    else if (req.headers['user-agent'].indexOf("Chrome") === -1) {
        site.askForLogin(res, req.url, '', 'Please use Google Chrome to use the admin interface');
    }
    else {
        next();
    }
};

// redirects to login page
site.askForLogin = function (res, afterLoginPage, username, err) {
    if (err == null) err = '';
    if (username == null) username = '';

    res.render('login', {
        locals:{
            afterLogin:afterLoginPage,
            username:username,
            error:err
        },
        layout:'layout-admin.jade'
    });
};

// assigns the functionality needed before different modules are ready to be initilized (before config settings have been set)
site.assignPreInitFunctionality = function (app, server) {
    app.post('/login', function (req, res) {
        api.accounts.login(req, req.body.username, req.body.password, function (err) {
            if (err) site.askForLogin(res, req.body.afterLogin, req.body.username, err);
            else    res.redirect(req.body.afterLogin);
        });
    });

    app.get('/logout', function (req, res) {
        api.accounts.logOut(req, function (err) {
            if (err) log.warning(err);
            res.redirect('/');
        });
    });

    app.get('/config', function (req, res) {
        if (api.accounts.isAdmin(req)) {
            _renderConfigPage(res,null);
        }
        else {
            site.askForLogin(res, '/config');
        }
    });

    app.post('/config', function (req, res) {
        if (api.accounts.isAdmin(req)) {
            config.setUp(req.body, function (err) {
                if (err == null) {
                    server.runSite(function () {
                        res.redirect('/config');
                    });
                }
                else {
                    _renderConfigPage(res,err);
                }
            });
        }
        else {
            site.askForLogin(res, '/config');
        }
    });
};

function _renderConfigPage(res,err) {
    if(err != null) {
        err = err + "<br /><br />The live site was not updated to use the new configuration due to errors."
    }

    res.render('config/config', {
        locals:{
            configParams:config.getParameters(),
            profileName:config.getProfileNameKey(),
            profileValue:config.getActiveProfileName(),
            revisionName:config.getRevisionKey(),
            revisionValue:config.getConfigRevision(),
            error: err
        },
        layout:'layout-admin.jade'
    });
}

site.renderSmtpTest = function (req, http_res, email, num) {
    log.debug("rendersmtptest");
    if (num == 1)
        smtp.addSubscriber(email, function (err, docs) {
            if (err)
                globalFunctions.showError(http_res, err);
            http_res.render('mobile', {layout:false, model:[""] });
            log.debug("added");
        });
    else if (num == 2)
        smtp.removeSubscriber(email, function (err, docs) {
            if (err)
                globalFunctions.showError(http_res, err);
            http_res.render('mobile', {layout:false, model:[""] });
            log.debug("removed");
        });
    else if (num == 3) {
        api.group.docs(LAYOUT_GROUPS.Frontpage.namespace, null, function (err, result) {
            _.defaults(result, homeModel);

            api.docsByDate(null, null, function (err, docs) {
                smtp.sendNewsletter(docs, function (err2, res2) {
                    http_res.send(res2);
                    log.debug("sent email");
                });
            });
        });
    }
};

function _parseAuthor(doc) {
    doc.authorsArray = _.clone(doc.authors);
    doc.authors = "";
    doc.authorsHtml = "";
    if (doc.authorsArray && doc.authorsArray.length > 0) {
        for(var i = 0; i < doc.authorsArray.length; i ++) {
            doc.authorsHtml += "<a href='/staff/"+doc.authorsArray[i].replace(/ /g,'-')+"'>"+doc.authorsArray[i]+"</a>";
            doc.authors += doc.authorsArray[i];
            if(i < (doc.authorsArray.length-1)) {
                doc.authors += ", ";
                doc.authorsHtml += ", ";
            }
        }
    }
    return doc;
}

function _showSearchArticles(err,req,http_res,docs,facets) {
    if (err) return globalFunctions.showError(http_res, err);
                    
    docs.forEach(function(doc) {
        if(doc.urls != null) doc.url = '/article/' + doc.urls[doc.urls.length - 1];
        else doc.url = '/';

        // convert timestamp
        if (doc.created) {
            doc.date = _convertTimestamp(doc.created);
        }

        doc.authorsHtml = "";
        if (doc.authors && doc.authors.length > 0) {
            for(var i = 0; i < doc.authors.length; i ++) {
                doc.authorsHtml += "&nbsp;<a href= '/author/"+doc.authors[i].replace(/ /g,'-')+"?sort=date&order=desc'>"+doc.authors[i]+"</a>";
                if(i < (doc.authors.length-1)) doc.authorsHtml += ",";
            }
        }
    });

    var currentFacets = req.query.facets;
    if(!currentFacets) currentFacets = '';

    var validSections = globalFunctions.convertObjectToArray(config.get("TAXONOMY_MAIN_SECTIONS"));
    // filter out all sections other than main sections
    Object.keys(facets.Section).forEach(function(key) {
        if (!_.include(validSections, key)) {
            delete facets.Section[key];
         }
    });
                    
    http_res.render(
        'site/search',
         {
             locals:{
                docs:docs, currentFacets:currentFacets, facets:facets, query:req.params.query, sort:req.query.sort, order:req.query.order
             },
             layout: "layout-optimized",
             css:asereje.css(['container/style', 'site/search'])
         }
    );

    return null;
}

