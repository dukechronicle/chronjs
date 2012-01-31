var site = exports;

var api = require('./api');
var config = require('../../config');
var globalFunctions = require('../../global-functions');
var log = require('../../log');
var redis = require('../../redisclient');
var rss = require('./rss');
var sitemap = require('../../sitemap');

var _ = require("underscore");
var asereje = require('asereje');
var async = require('async');
var fs = require('fs');
var nimble = require('nimble');

var LAYOUT_GROUPS = null;

var homeModel = JSON.parse(fs.readFileSync("sample-data/frontpage.json"));
var newsModel = JSON.parse(fs.readFileSync("sample-data/news.json"));
var sportsModel = JSON.parse(fs.readFileSync("sample-data/sports.json"));
var columnistsData = JSON.parse(fs.readFileSync("sample-data/columnists.json"));
var columnistsHeadshots = {};
columnistsData.forEach(function(columnist) {
    columnistsHeadshots[columnist.name] = {
        headshot: columnist.headshot,
        tagline: columnist.tagline
    };
});

var BENCHMARK = false;
var MOBILE_BROWSER_USER_AGENTS = ["Android", "iPhone", "Windows Phone", "Blackberry", "Symbian", "Palm", "webOS"];

var twitterFeeds = ["DukeChronicle", "ChronicleRecess", "TowerviewMag", "DukeBasketball", "ChronPhoto", "ChronicleSports"];


site.init = function (app, callback) {
    LAYOUT_GROUPS = config.get("LAYOUT_GROUPS");

    api.init(function (err2) {
        if (err2) {
            log.crit("api init failed!");
            return callback(err2);
        }
        sitemap.latestNewsSitemap('public/sitemaps/news_sitemap', function (err) {
            if (err) log.warning("Couldn't build news sitemap: " + err);
        });
        // redirect mobile browsers to the mobile site
        app.get('/*', function(req, res, next) {

            var userAgent = req.headers['user-agent'];

            // only run the code below this line if they are not accessing the mobile site            
            if(req.url.split('/',2)[1] == 'm') return next();
            
            for(var i in MOBILE_BROWSER_USER_AGENTS) {
                if(userAgent.indexOf(MOBILE_BROWSER_USER_AGENTS[i]) != -1) {
                    res.redirect('/m');
                    return;
                }
            }          
            next();
        });

        app.get('/about-us', function (req, res) {
            res.render('pages/about-us', {
		filename: 'pages/about-us',
		css: asereje.css(['container/style'])
	    });
        });

        app.get('/privacy-policy', function (req, res) {
            res.render('pages/privacy-policy', {
		filename:'pages/privacy-policy',
		css: asereje.css(['container/style'])
	    });
        });

        app.get('/user-guidelines', function (req, res) {
            res.render('pages/user-guidelines', {
		filename:'pages/user-guidelines',
		css: asereje.css(['container/style'])
	    });
        });

        app.get('/advertising', function (req, res) {
            res.render('pages/advertising', {
		filename:'pages/advertising',
		css: asereje.css()
	    });
        });

        app.get('/subscribe', function (req, res) {
            res.render('pages/subscribe', {
		filename:'pages/subscribe',
		css: asereje.css()
	    });
        });

        app.get('/edit-board', function (req, res) {
            res.render('pages/edit-board', {
		filename:'pages/edit-board',
		css: asereje.css()
	    });
        });

        app.get('/letters-to-the-editor', function (req, res) {
            res.render('pages/letters', {
		filename:'pages/letters',
		css: asereje.css()
	    });
        });

        app.get('/contact', function (req, res) {
            res.render('pages/contact', {
		filename:'pages/contact',
		css: asereje.css(['container/style'])
	    });
        });


        app.get('/', function (req, res) {
            getFrontPageContent(function (err, model) {
                res.render('site/index', {
                    css:asereje.css(['slideshow/style', 'container/style', 'site/frontpage']),
                    filename:'views/site/index.jade',
                    locals: {
                        model:model
                    }
                });
            });
        });

        app.get('/news', function (req, res) {
            getNewsPageContent(function (err, model, children) {
                res.render('site/news', {
                    css:asereje.css(['container/style', 'site/section', 'site/news']),
                    subsections:children,
                    filename:'views/site/news.jade',
                    model:model
                });
            });
        });

        app.get('/sports', function (req, res) {
            getSportsPageContent(function (err, model, children) {
                res.render('site/sports', {
                    css:asereje.css(['container/style', 'site/section', 'site/sports', 'slideshow/style']),
                    subsections:[children.men, children.women],
                    filename:'views/site/sports.jade',
                    model:model
                });
            });
        });

        app.get('/opinion', function (req, res) {
            getOpinionPageContent(function (err, model, children) {
                res.render('site/opinion', {
                    css:asereje.css(['container/style', 'site/section', 'site/opinion']),
                    subsections:children,
                    filename:'views/site/opinion.jade',
                    model:model
                });
            });
        });

        app.get('/recess', function (req, res) {
            getRecessPageContent(function (err, model, children) {
                res.render('site/recess', {
                    css:asereje.css(['container/style', 'site/section', 'site/recess']),
                    subsections:children,
                    filename:'views/site/recess.jade',
                    model:model
                });
            });
        });

        app.get('/towerview', function (req, res) {
            getTowerviewPageContent(function (err, model, children) {
                res.render('site/towerview', {
                    css:asereje.css(['container/style', 'site/section', 'site/towerview']),
                    subsections:children,
                    filename:'views/site/towerview.jade',
                    model:model
                });
            });
        });

        app.get('/section/*', function (req, res) {
            var params = req.params.toString().split('/');
            getSectionContent(params, function (err, section, docs, children, parents, popular) {
		res.render('site/section', {
		    css:asereje.css(['container/style', 'site/section']),
		    locals: {
                        docs:docs,
			subsections:children,
			parentPaths:parents,
			section:section,
			popular: popular
		    }
		});
            });
        });
        
        // Makes search url more readable
        app.get('/search', function (req, res) {
            var query = "--";            
            if (req.param('search') != null)
                query = req.param('search').replace(/ /g, '-');
            res.redirect('/search/' + query + '?sort=relevance&order=desc'); 
        });

        app.get('/search/:query', function (req, http_res) {
            api.search.docsBySearchQuery(req.params.query.replace(/-/g, ' '), req.query.sort, req.query.order, req.query.facets, 1, function (err, docs, facets) {
                _showSearchArticles(err, req, http_res, docs, facets);
            });
        });

        app.get('/staff/:query', function (req, res) {
            var name = req.params.query.replace(/-/g, ' ');
            getAuthorContent(name, function (err, docs) {
	        res.render('site/people', {
                    css:asereje.css(['container/style', 'site/people']),
                    locals:{
                        docs: docs,
                        name: globalFunctions.capitalizeWords(name)
                    }
                });
            });
        });

        app.get('/page/:url', function (req, res, next) {
            var url = req.params.url;
            getPageContent(url, function (err, doc, model) {
                if (err)
                    next();
                else if ('/page/' + url != doc.path)
                    res.redirect(doc.url);
                else res.render('page', {
		    css: asereje.css(),
                    filename:'views/page.jade',
                    locals: {
                        doc:doc,
                        model: model
                    }
                });
            });
        });

        app.get('/article/:url', function (req, res, next) {
            var url = req.params.url;
            var isAdmin = api.accounts.isAdmin(req);
            getArticleContent(url, function (err, doc, model, parents) {
                if (err)
                    next();
                else if ('/article/' + url != doc.url)
                    res.redirect(doc.url);
                else res.render('article', {
                    locals: {
                        doc:doc,
                        isAdmin:isAdmin,
                        model:model,
                        parentPaths:parents
                    },
                    filename:'views/article',
                    layout: 'layout-article',
                    css:asereje.css(['container/style', 'article'])
                });
            });
        });

        app.get('/article/:url/print', function (req, res, next) {
            var url = req.params.url;
            getArticleContent(url, function (err, doc, model, parents) {
                if (err)
                    next();
                else if ('/article/' + url != doc.url)
                    res.redirect(doc.url + '/print');
                else {
                    doc.url += '/print';
                    doc.fullUrl += '/print';
                    res.render('article-print', {
			css: asereje.css(),
                        filename:'views/article-print.jade',
                        layout:"layout-print.jade",
                        locals: {
                            doc:doc
                        }
                    });
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
                    if (req.query.removeImage) {
                        api.image.removeVersionFromDocument(doc._id, null, req.query.removeImage, function(err, doc) {
                            if (err) globalFunctions.showError(http_res, err);
                            else http_res.redirect('/article/' + url + '/edit');
                        });
                    }
                    else {
                        api.taxonomy.getTaxonomyListing(function(err, taxonomy) {
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
                                    afterAddImageUrl: '/article/' + url + '/edit',
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

        app.get('/newsletter', function (req, res) {
            res.render('site/newsletter', {
		filename: 'site/newsletter',
		css: asereje.css()
	    });
        });

        app.post('/newsletter', function (req, http_res) {
            var email = req.body.email;
            var action = req.body.action;

            var afterFunc = function() {
                http_res.render('site/newsletter', {
                    email: email,
                    action: action,
		    css: asereje.css()
                });
            };

            if (action == "subscribe")
                api.newsletter.addSubscriber(email, afterFunc);
            else if(action == "unsubscribe")
                api.newsletter.removeSubscriber(email, afterFunc);
            else
                afterFunc();
        });

	// Webmaster tools stuff -- don't delete
        app.get('/mu-7843c2b9-3b9490d6-8f535259-e645b756', function (req, res) {
            res.send('42');
        });

        //The 404 Route (ALWAYS Keep this as the last route)
        app.get('*', function(req, res) {
            res.render('pages/404', {
                filename: 'pages/404',
                css: asereje.css(['pages/style']),
	        status: 404,
                url: req.url
            });
        });

        callback();
    });
};

// Checks if you are an admin with browser check
site.checkAdmin = function (req, res, next) {
    site.restrictToAdmin(req, res, function() {
        if (req.headers['user-agent'].indexOf("Chrome") === -1) {
            site.askForLogin(res, req.url, '', 'Please use Google Chrome to use the admin interface');
        }
        else {
            next();
        }
    });
};

// Checks if you are an admin
site.restrictToAdmin = function (req, res, next) {
    //if not admin, require login
    if (!api.accounts.isAdmin(req)) {
        site.askForLogin(res, req.url);
    }
    else {
        next();
    }
};

// redirects to login page
site.askForLogin = function (res, afterLoginPage, username, err) {
    res.render('login', {
        locals:{
            afterLogin:afterLoginPage,
            username:username || '',
            error:err || ''
        },
        layout:'layout-admin.jade'
    });
};

// assigns the functionality needed before different modules are ready to be
// initilized (before config settings have been set)
site.assignPreInitFunctionality = function (app, runSite) {
    app.post('/login', function (req, res) {
	var body = req.body;
        api.accounts.login(req, body.username, body.password, function (err) {
            if (err)
		site.askForLogin(res, body.afterLogin, body.username, err);
            else
		res.redirect(req.body.afterLogin);
        });
    });

    app.get('/logout', function (req, res) {
        api.accounts.logout(req, function (err) {
            if (err) log.warning(err);
            res.redirect('/');
        });
    });

    app.get('/config', function (req, res) {
        if (api.accounts.isAdmin(req))
            _renderConfigPage(res);
        else
            site.askForLogin(res, '/config');
    });

    app.post('/config', function (req, res) {
        if (api.accounts.isAdmin(req))
            config.setUp(req.body, function (err) {
                if (err)
		    _renderConfigPage(res,err);
		else 
                    runSite(function (err) {
			if (err) log.error(err);
                        res.redirect('/');
                    });
            });
        else
	    site.askForLogin(res, '/config');
    });
};


function _renderConfigPage(res,err) {
    if (err)
        err += "<br /><br />The live site was not updated to use the new configuration due to errors."

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

function _articleViewsKey(taxonomy) {
    return "article_views:" + config.get("COUCHDB_URL") + ":" + config.get("COUCHDB_DATABASE") + ":" + JSON.stringify(taxonomy);
}

function _showSearchArticles(err,req,http_res,docs,facets) {
    if (err) return globalFunctions.showError(http_res, err);
                    
    docs.forEach(function(doc) {
        if(doc.urls != null) doc.url = '/article/' + doc.urls[doc.urls.length - 1];
        else doc.url = '/';

        // convert timestamp
        if (doc.created) {
            doc.date = globalFunctions.formatTimestamp(doc.created, "mmmm d, yyyy");
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
             css:asereje.css(['container/style', 'site/search'])
         }
    );

    return null;
}

function getFrontPageContent(callback) {
    var start = Date.now();
    async.parallel([
        function (cb) { //0
            api.group.docs(LAYOUT_GROUPS.Frontpage.namespace, null, function (err, result) {
                if (err) return cb(err);
                if (BENCHMARK) log.info("API TIME %d", Date.now() - start);
                return cb(null, result);
            });
        },
        function (cb) { //1
            var popularArticles = 7;
            redis.client.zrevrange(_articleViewsKey([]), 0, popularArticles - 1, function (err, popular) {
                if (err) return cb(err);
                popular = popular.map(function (str) {
                    var parts = str.split('||');
                    return {
                        url:'/article/' + parts[0],
                        title:parts[1]
                    };
                });
                if (BENCHMARK) log.info("REDIS TIME %d", Date.now() - start);
                cb(null, popular);
            });
        },
        function (cb) { //2
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
                return cb(err, twitter);
            });
        }
    ], function (err, results) {
        if (err) {
            log.warning(err);
            callback(err);
        }
        else {
            if (BENCHMARK) log.info("TOTAL TIME %d", Date.now() - start);
            var model = results[0];
            _.defaults(model, homeModel);
            model.popular = results[1];
            model.twitter = results[2];
            callback(null, model);
        }
    });
}

function getNewsPageContent(callback) {
    async.parallel([
        function (cb) {
            api.group.docs(LAYOUT_GROUPS.News.namespace, null, cb);
        },
        function (cb) {
            redis.client.zrevrange(_articleViewsKey(['News']), 0, 3, function (err, popular) {
                if (err) cb (err);
                else cb(null, popular.map(function (str) {
                    var parts = str.split('||');
                    return {
                        url:'/article/' + parts[0],
                        title:parts[1]
                    };
                }));
            });
        },
        function (cb) {
            rss.getRSS('newsblog', function (err, rss) {
                if (!err && rss && rss.items && rss.items.length > 0) {
                    var Blog = rss.items.map(function (item) {
                        item.url = item.link;
                        item.title = item.title.replace(/\&#8217;/g, '’');
                        delete item.link;
                        return item;
                    });
                    Blog.splice(6, Blog.length - 6);
                    cb(null, Blog);
                }
                else cb(err, []);
            });
        },
        function (cb) {
            api.taxonomy.getChildren(['News'], cb);
        }
    ], function (err, results) {
        if (err) {
            log.warning(err);
            callback(err);
        }
        else {
            var model = results[0];
            _.defaults(model, newsModel);            
            model.popular = results[1];
            model.Blog = results[2]
            model.adFullRectangle = {
                "title":"Advertisement",
                "imageUrl":"/images/ads/monster.png",
                "url":"http://google.com",
                "width":"300px",
                "height":"250px"
            };
            var children = results[3];
            callback(null, model, children);
        }
    });
}

function getSportsPageContent(callback) {
    async.parallel([
        function (cb) { //0
            api.group.docs(LAYOUT_GROUPS.Sports.namespace, null, cb);
        },
        function (cb) { //1
            rss.getRSS('sportsblog', function (err, res) {
                if (!err && res && res.items && res.items.length > 0) {
                    var Blog = res.items.map(function (item) {
                        item.url = item.link;
                        item.title = item.title.replace(/\&#8217;/g, '’');
                        delete item.link;
                        return item;
                    });
                    Blog.splice(5, Blog.length - 5);
                    cb(null, Blog)
                } else cb(err, []);
            });
        },
        function (cb) { //2
            api.taxonomy.getChildren(['Sports', 'Men'], cb);
        },
        function (cb) { //3
            api.taxonomy.getChildren(['Sports', 'Women'], cb);
        }], function (err, results) {
            if (err) {
                log.warning(err);
                callback(err);
            }
            else {
                var model = results[0];
                _.defaults(model, sportsModel);
                model.Blog = results[1];
                model.adFullRectangle = {
                    "title":"Advertisement",
                    "imageUrl":"/images/ads/monster.png",
                    "url":"http://google.com",
                    "width":"300px",
                    "height":"250px"
                };
                var children = { men: results[2], women: results[3] };
                callback(null, model, children);
            }
        });
}

function getOpinionPageContent(callback) {
    async.parallel([
        function (cb) { //0
            api.group.docs(LAYOUT_GROUPS.Opinion.namespace, null, cb);
        },
        function (cb) { //1
            api.taxonomy.getChildren(['Opinion'], cb);
        },
        function (cb) { //2
            rss.getRSS('blog-opinion', function (err, res) {
                if (!err && res && res.items && res.items.length > 0) {
                    var Blog = res.items.map(function (item) {
                        item.url = item.link;
                        item.title = item.title.replace(/\&#8217;/g, '’');
                        delete item.link;
                        return item;
                    });
                    Blog.splice(5, Blog.length - 5);
                    cb(null, Blog)
                } else cb(err, []);
            });
        },
        function (cb) { // 3
            api.authors.getLatest("Editorial Board", "Opinion", 5, cb);
        },
        function (cb) { //4
            async.map(columnistsData,
                      function(columnist, _callback) {
                          api.authors.getLatest(columnist.user || columnist.name, "Opinion", 5, function(err, res) {
                              columnist.stories = res;
                              _callback(err, columnist);
                          })
                      }, cb);
        }], function (err, results) {
            if (err)
                callback(err);
            else {
                var model = results[0];
                if (model.Featured) {
                    model.Featured.forEach(function(article) {
                        article.author = article.authors[0];
                        var columnistObj = null;
                        if (columnistObj = columnistsHeadshots[article.author]) {
                            if (columnistObj.headshot) article.thumb = columnistObj.headshot;
                            if (columnistObj.tagline) article.tagline = columnistObj.tagline;
                        }
                    });
                }
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

                var children = results[1];
                callback(null, model, children);
            }
        });
}

function getRecessPageContent(callback) {
    async.parallel([
        function (cb) {
            api.group.docs(LAYOUT_GROUPS.Recess.namespace, null, cb);
        },
        function (cb) {
            api.taxonomy.getChildren(['Recess'], cb);
        },
        function (cb) {
            rss.getRSS('recessblog', function (err, rss) {
                if (!err && rss && rss.items && rss.items.length > 0) {
                    var Blog = rss.items.map(function (item) {
                        item.url = item.link;
                        item.title = item.title.replace(/\&#8217;/g, '’');
                        delete item.link;
                        return item;
                    });
                    Blog.splice(3, Blog.length - 3);
                    cb(null, Blog);
                } else cb(err, []);
            });
        }], function (err, results) {
            if (err)
                callback(err);
            else {
                var model = results[0];
                model.Blog = results[2];
                model.adMedRectangle = {
                    "title":"Advertisement",
                    "imageUrl":"https://www.google.com/help/hc/images/adsense_185665_adformat-text_250x250.png",
                    "url":"http://google.com",
                    "width":"250px",
                    "height":"250px"
                };
                var children = results[1];
                
                callback(null, model, children);
            }
        });
}

function getTowerviewPageContent(callback) {
    async.parallel([
        function (cb) {
            api.group.docs(LAYOUT_GROUPS.Towerview.namespace, null, cb);
        },
        function (cb) {
            api.taxonomy.getChildren(['Towerview'], cb);
        }], function (err, results) {
            if (err)
                callback(err);
            else {
                var model = results[0];
                model.adFullRectangle = {
                    "title":"Advertisement",
                    "imageUrl":"/images/ads/monster.png",
                    "url":"http://google.com",
                    "width":"300px",
                    "height":"250px"
                };
                var children = results[1];
                callback(null, model, children);
            }
        });
}

function getSectionContent(params, callback) {
    var section = _.last(params);
    async.parallel([
        function (cb) {
            redis.client.zrevrange(_articleViewsKey(params), 0, 4, function (err, popular) {
                if (err) cb(err)
                else cb(null, popular.map(function (str) {
                    var parts = str.split('||');
                    return { url:'/article/' + parts[0], title:parts[1] };
                }));
            });
        },
        function (cb) {
            api.taxonomy.docs(section, 20, function (err, docs) {
                if (err) cb(err)
                else modifyArticlesForDisplay(docs, cb);
            });
        },
        function (cb) {
	    api.taxonomy.getParents(params, cb);
        },
        function (cb) {
            api.taxonomy.getChildren(params, cb);
        }], function (err, results) {
            if (err)
                callback(err);
            else {
                var popular = results[0];
                var docs = results[1];
                var parents = results[2]
                var children = results[3];
                callback(null, section, docs, children, parents, popular);
            }
        });
}

function getAuthorContent(name, callback) {
    api.search.docsByAuthor(name, 'desc', '', 1, function (err, docs) {
        if (err) callback(err);
        else modifyArticlesForDisplay(docs, callback);
    });
}

function getArticleContent(url, callback) {
    async.parallel([
        function (cb) {
            api.articleForUrl(url, function (err, doc) {
                if (err) cb(err);
                else cb(null, modifyArticleForDisplay(doc));
            });
        },
        function (cb) {
            redis.client.zrevrange(_articleViewsKey([]), 0, 4,
                                   function (err, popular) {
                                       if (err) cb(err);
                                       else cb(null, popular.map(function (str) {
                                           var parts = str.split('||');
                                           return {
                                               url:'/article/' + parts[0],
                                               title:parts[1]
                                           };
                                       }));
                                   });
        }], function (err, results) {
            if (err) callback(err);
            else {
                var doc = results[0];
                var model = { adFullRectangle: {
                    "title":"Advertisement",
                    "imageUrl":"/images/ads/monster.png",
                    "url":"http://google.com",
                    "width":"300px",
                    "height":"250px"
                }};
                model.popular = results[1];

	        api.taxonomy.getParents(doc.taxonomy, function (err, parents) {
                    if (err) callback(err);
                    else callback(null, doc, model, parents);
                });
		    
	        // Statistics for most read
                if (doc.taxonomy) {
                    var length = doc.taxonomy.length;
                    var taxToSend = _.clone(doc.taxonomy);
                    var multi = redis.client.multi();
                    for (var i = length; i >= 0; i--) {
                        taxToSend.splice(i, 1);
                        multi.zincrby(_articleViewsKey(taxToSend), 1, _.last(doc.urls) + "||" + doc.title);
                    }
                    multi.exec(function (err, res) {
                        if (err) {
                            log.warning("Failed to register article view: " + _.last(doc.urls));
                            log.warning(err);
                        }
                    });
                }
            }
        });
}

function getPageContent(url, callback) {
    api.nodeForTitle(url, function (err, doc) {
        if (err) callback(err);
        else {
            doc.path = "/page/" + url;
            doc.fullUrl = "http://dukechronicle.com/page/" + url;
            var model = { adFullRectangle: {
                "title":"Advertisement",
                "imageUrl":"/images/ads/monster.png",
                "url":"http://google.com",
                "width":"300px",
                "height":"250px"
            }};
            callback(null, doc, model);
        }
    });
}

function modifyArticlesForDisplay(docs, callback) {
    async.filter(docs, function (doc, cb) {
        modifyArticleForDisplay(doc);
        if (doc.url === undefined) cb(null);
        else cb(doc);
    }, function (results) {
        callback(null, results);
    });
}

function modifyArticleForDisplay(doc, callback) {
    if (doc.urls) {
        doc.url = '/article/' + _.last(doc.urls);
        doc.fullUrl = 'http://dukechronicle.com' + doc.url;
    }
    if (doc.created)
        doc.date = globalFunctions.formatTimestamp(doc.created, "mmmm d, yyyy");

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