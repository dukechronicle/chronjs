var site = exports;

var api = require('./api');
var config = require('../../config');
var log = require('../../log');
var redis = require('../../redisclient');
var route = require('../../route');
var rss = require('./rss');
var popular = require('./popular');
var util = require('../../util');

var _ = require("underscore");
var async = require('async');
var nimble = require('nimble');

var LAYOUT_GROUPS;
var twitterFeeds = [];
var BENCHMARK = false;

site.init = function () {
    LAYOUT_GROUPS = config.get("LAYOUT_GROUPS");

    twitterFeeds = _.filter(config.get("RSS_FEEDS"), function(rssFeed) {
        return rssFeed.url.indexOf("api.twitter.com") !== -1;
    });
};

// Checks if you are an admin with browser check
site.checkAdmin = function(req, res, next) {
    site.restrictToAdmin(req, res, function() {
        if(req.headers['user-agent'].indexOf("Chrome") === -1) {
            site.askForLogin(res, req.url, '', 'Please use Google Chrome to use the admin interface');
        } else {
            next();
        }
    });
};
// Checks if you are an admin
site.restrictToAdmin = function(req, res, next) {
    //if not admin, require login
    if(!api.accounts.isAdmin(req)) {
        site.askForLogin(res, req.url);
    } else {
        next();
    }
};
// redirects to login page
site.askForLogin = function(res, afterLoginPage, username, err) {
    res.render('admin/login', {
        locals : {
            afterLogin : afterLoginPage,
            username : username || '',
            error : err || ''
        }
    });
};

site.renderConfigPage = function(req, res, err) {
    if(err) {
        if( typeof err === 'object')
            err = JSON.stringify(err);
        err += "<br /><br />The live site was not updated to use the new configuration due to errors."
    }

    res.render('config', {
        locals : {
            configParams : config.getParameters(),
            profileName : config.getProfileNameKey(),
            profileValue : config.getActiveProfileName(),
            revisionName : config.getRevisionKey(),
            revisionValue : config.getConfigRevision(),
            error : err,
            showOnly : req.query.showOnly
        }
    });
};

site.getFrontPageContent = function (callback) {
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
            api.disqus.listHot(popularArticles, function(err, results) {
                if(err) return cb(err);
                
                results.forEach(function(article) {
                    article.info = article.numComments + " comment";
                    if(article.numComments != 1) article.info += "s";
                });

                cb(null, modifyArticlesForDisplay(results));
            });
        },
        function (cb) { //2
            var selectedFeed = twitterFeeds[Math.floor(Math.random() * twitterFeeds.length)];

            var twitter = {
                user: selectedFeed.url.split("screen_name=")[1],
                title: 'Twitter'
            };
            twitter.imageUrl = "https://api.twitter.com/1/users/profile_image?screen_name="+twitter.user+"&size=bigger";

            rss.getRSS(selectedFeed.title, function (err, tweets) {
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
            model.popular = results[1];
            model.twitter = results[2];
            model.printEdition = {
                title: "Print",
                imageUrl: "http://d2sug25c5hnh7r.cloudfront.net/images/issuu-thumb.png",
                url: "http://issuu.com/dukechronicle/docs",
                width: "134px",
                height: "60px"
            };
            callback(null, model);
        }
    });
};

site.getNewsPageContent = function(callback) {
    async.parallel([
    function(cb) {
        api.group.docs(LAYOUT_GROUPS.News.namespace, null, cb);
    },
    function(cb) {
        popular.getPopularArticles(['News'], 4, cb);
    },
    function(cb) {
        rss.getRSS('newsblog', function(err, rss) {
            if(!err && rss && rss.items && rss.items.length > 0) {
                var Blog = rss.items.map(function(item) {
                    item.url = item.link;
                    item.title = item.title.replace(/\&#8217;/g, '’');
                    delete item.link;
                    return item;
                });
                Blog.splice(6, Blog.length - 6);
                cb(null, Blog);
            } else
                cb(err, []);
        });
    },

    function(cb) {
        api.taxonomy.getChildren(['News'], cb);
    }], function(err, results) {
        if(err) {
            log.warning(err);
            callback(err);
        } else {
            var model = results[0];
            model.popular = results[1];
            model.Blog = results[2];
            model.multimedia = config.get('MULTIMEDIA_HTML');
            model.adFullRectangle = {
                "title" : "Advertisement",
                "imageUrl" : "/images/ads/monster.png",
                "url" : "http://google.com",
                "width" : "300px",
                "height" : "250px"
            };
            var children = results[3];
            callback(null, model, children);
        }
    });
};

site.getSportsPageContent = function(callback) {
    async.parallel([
        function(cb) {//0
            api.group.docs(LAYOUT_GROUPS.Sports.namespace, null, cb);
        },
        function(cb) {//1
            rss.getRSS('sportsblog', function(err, res) {
                if(!err && res && res.items && res.items.length > 0) {
                    var Blog = res.items.map(function(item) {
                        item.url = item.link;
                        item.title = item.title.replace(/\&#8217;/g, '’');
                        delete item.link;
                        return item;
                    });
                    Blog.splice(5, Blog.length - 5);
                    cb(null, Blog)
                } else
                    cb(err, []);
            });
        },
        function(cb) {//2
            api.taxonomy.getChildren(['Sports'], cb);
        }
    ], function(err, results) {
        if(err) {
            log.warning(err);
            callback(err);
        } else {
            var model = results[0];
            model.Blog = results[1];
            model.multimedia = config.get('MULTIMEDIA_HTML');
            model.adFullRectangle = {
                "title" : "Advertisement",
                "imageUrl" : "/images/ads/monster.png",
                "url" : "http://google.com",
                "width" : "300px",
                "height" : "250px"
            };
            var children = results[2];
            callback(null, model, children);
        }
    });
};

site.getOpinionPageContent = function(callback) {
    async.parallel([
    function(cb) {//0
        api.group.docs(LAYOUT_GROUPS.Opinion.namespace, null, cb);
    },

    function(cb) {//1
        api.taxonomy.getChildren(['Opinion'], cb);
    },

    function(cb) {//2
        rss.getRSS('blog-opinion', function(err, res) {
        if(!err && res && res.items && res.items.length > 0) {
            var Blog = res.items.map(function(item) {
                item.url = item.link;
                item.title = item.title.replace(/\&#8217;/g, '’');
                delete item.link;
                return item;
            });
            Blog.splice(5, Blog.length - 5);
            cb(null, Blog)
        } else
            cb(err, []);
        });
    },

    function(cb) {// 3
        api.authors.getLatest("Editorial Board", "Opinion", 5, cb);
    },

    function(cb) {//4
        api.authors.getColumnists(function(err, columnists) {
            async.map(columnists, function(columnist, _callback) {
                api.authors.getLatest(columnist.user || columnist.name, "Opinion", 7, function(err, res) {
                    columnist.stories = res;
                    _callback(err, columnist);
                })
            }, cb);
        });
    }], function(err, results) {
            if(err)
                callback(err);
            else {
                // maps columnist headshots to name for use on rest of page
                COLUMNIST_HEADSHOTS = {};
                results[4].forEach(function(columnist) {
                    var name = columnist.name.toLowerCase();
                    COLUMNIST_HEADSHOTS[name] = {tagline : columnist.tagline};
                    if (columnist.images && columnist.images.ThumbSquareM)
                        COLUMNIST_HEADSHOTS[name].headshot = columnist.images.ThumbSquareM.url;
                });


                var model = results[0];
                if (model.Featured) {
                    model.Featured.forEach(function(article) {
                        article.author = article.authors[0];
                        var columnistObj = null;
                        if( columnistObj = COLUMNIST_HEADSHOTS[article.author.toLowerCase()]) {
                            if(columnistObj.headshot)
                                article.thumb = columnistObj.headshot;
                            if(columnistObj.tagline)
                                article.tagline = columnistObj.tagline;
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
                    "title" : "Advertisement",
                    "imageUrl" : "/images/ads/monster.png",
                    "url" : "http://google.com",
                    "width" : "300px",
                    "height" : "250px"
                };

                model.adFullBanner = {
                    "title" : "Ad",
                    "imageUrl" : "/images/ads/full-banner.jpg",
                    "url" : "http://google.com",
                    "width" : "468px",
                    "height" : "60px"
                };

                var children = results[1];
                callback(null, model, children);
            }
        });
};

site.getRecessPageContent = function(callback) {
    async.parallel([
    function(cb) {
        api.group.docs(LAYOUT_GROUPS.Recess.namespace, null, cb);
    },

    function(cb) {
        api.taxonomy.getChildren(['Recess'], cb);
    },

    function(cb) {
        rss.getRSS('recessblog', function(err, rss) {
            if(!err && rss && rss.items && rss.items.length > 0) {
                var Blog = rss.items.map(function(item) {
                    item.url = item.link;
                    item.title = item.title.replace(/\&#8217;/g, '’');
                    delete item.link;
                    return item;
                });
                Blog.splice(3, Blog.length - 3);
                cb(null, Blog);
            } else
                cb(err, []);
        });
    }], 
    function(err, results) {
        if(err)
            callback(err);
        else {
            var model = results[0];
            model.Blog = results[2];
            model.multimedia = config.get('MULTIMEDIA_HTML');
            model.adMedRectangle = {
                "title" : "Advertisement",
                "imageUrl" : "https://www.google.com/help/hc/images/adsense_185665_adformat-text_250x250.png",
                "url" : "http://google.com",
                "width" : "250px",
                "height" : "250px"
            };
            var children = results[1];

            callback(null, model, children);
        }
    });
};

site.getTowerviewPageContent = function(callback) {
    async.parallel([
    function(cb) {
        api.group.docs(LAYOUT_GROUPS.Towerview.namespace, null, cb);
    },

    function(cb) {
        api.taxonomy.getChildren(['Towerview'], cb);
    }], 
    function(err, results) {
        if(err)
            callback(err);
        else {
            var model = results[0];
            model.adFullRectangle = {
                "title" : "Advertisement",
                "imageUrl" : "/images/ads/monster.png",
                "url" : "http://google.com",
                "width" : "300px",
                "height" : "250px"
            };
            var children = results[1];
            callback(null, model, children);
        }
    });
};

site.getSectionContent = function (params, callback) {
    var section = _.last(params);
    async.parallel([
        function(cb) {
            popular.getPopularArticles(params, 5, cb);
        },
        function (cb) {
            api.taxonomy.docs(params, 20, null, function (err, docs, next) {
                if (err) cb(err)
                else cb(null, {docs:modifyArticlesForDisplay(docs), next:next});
            });
        },
        function (cb) {
            api.taxonomy.getParents(params, cb);
        },
        function (cb) {
            api.taxonomy.getChildren(params, function (err, children) {
                if (err) cb(null, {});
                else cb(null, children);
            });
        }], function (err, results) {
            if (err)
                callback(err);
            else {
                var popular = results[0];
                var docs = results[1].docs;
                var next = results[1].next;
                var parents = results[2]
                var children = results[3];
                callback(null, section, docs, next, children, parents, popular);
            }
        }
    );
};

site.getAuthorContent = function(name, callback) {
    async.parallel([
        function(cb) {
            api.search.docsByAuthor(name, 'desc', '', 1, function(err, docs) {
                if(err)
                    cb(err);
                else
                    callback(null, modifyArticlesForDisplay(docs));
            });
        },
        function(cb) {
            api.authors.getInfo(name, cb);
        }], function (err, results) {
            if (err)
                callback(err);
            else {
                var docs = results[0];
                var info = results[1][0];
                callback(null, docs, info);
            }
        }
    );
};

site.getSearchContent = function (wordsQuery, query, callback) {
    api.search.docsBySearchQuery(wordsQuery, query.sort, query.order, query.facets, 1, true, function (err, docs, facets) {
        if (err) callback(err);
        else {
            docs = modifyArticlesForDisplay(docs);
            var validSections = config.get("TAXONOMY_MAIN_SECTIONS");
            // filter out all sections other than main sections
            Object.keys(facets.Section).forEach(function(key) {
                if (!_.include(validSections, key))
                    delete facets.Section[key];
            });
            callback(null, docs, facets);
        }
    });
};

site.getArticleContent = function(url, callback) {
    api.articleForUrl(url, function(err, doc) {
        if (err) callback('not found');
        else {
            var displayDoc = modifyArticleForDisplay(doc);
            cache(site.getArticleContentUncached, 600, displayDoc)(
                function (err, model) {
                    callback(err, displayDoc, model);
                    popular.registerArticleView(doc, function(err,res){});
                });
        }
    });
};

site.getArticleContentUncached = function(doc, callback) {
    async.parallel([
    function(cb) {
        popular.getPopularArticles([], 5, cb);
    },
    function(cb) {
        api.search.relatedArticles(doc._id, 5, function(err, relatedArticles) {
            if (err) cb(err);
            else cb(null, modifyArticlesForDisplay(relatedArticles));
        });
    },
    function(cb) {
        api.taxonomy.getParents(doc.taxonomy, cb);
    }
    ], 
    function(err, results) {
        if(err)
            callback(err);
        else {
            var model = {
            adFullRectangle : {
                "title" : "Advertisement",
                "imageUrl" : "/images/ads/monster.png",
                "url" : "http://google.com",
                "width" : "300px",
                "height" : "250px"
            },
                    popular: results[0],
            related: results[1],
                    parents: results[2]
            };

            callback(null, model);
        }
    });
};

site.getPageContent = function(url, callback) {
    api.page.getByUrl(url, function(err, doc) {
        if(err)
            callback(err);
        else {
            doc.path = "/page/" + url;
            doc.fullUrl = "http://" + config.get('DOMAIN_NAME') + "/page/" + url;
            var model = {
                adFullRectangle : {
                    "title" : "Advertisement",
                    "imageUrl" : "/images/ads/monster.png",
                    "url" : "http://google.com",
                    "width" : "300px",
                    "height" : "250px"
                }
            };
            callback(null, doc, model);
        }
    });
};

function modifyArticlesForDisplay(docs) {
    docs = _.map(docs, function (doc) {
        return modifyArticleForDisplay(doc);
    });
    return _.filter(docs, function (doc) {
        return doc.url;
    });
}

function modifyArticleForDisplay(doc) {
    if(doc.urls) {
        doc.url = '/article/' + _.last(doc.urls);
        doc.fullUrl = "http://" + config.get('DOMAIN_NAME') + doc.url;
    }
    if(doc.created)
        doc.date = util.formatTimestamp(doc.created, "mmmm d, yyyy");

    doc.authorsArray = _.clone(doc.authors);
    doc.authors = "";
    doc.authorsHtml = "";
    if(doc.authorsArray && doc.authorsArray.length > 0) {
        for(var i = 0; i < doc.authorsArray.length; i++) {
            doc.authorsHtml += "<a href='/staff/" + doc.authorsArray[i].replace(/ /g, '-') + "'>" + doc.authorsArray[i] + "</a>";
            doc.authors += doc.authorsArray[i];
            if(i < (doc.authorsArray.length - 1)) {
                doc.authors += ", ";
                doc.authorsHtml += ", ";
            }
        }
    
        if(COLUMNIST_HEADSHOTS[doc.authorsArray[0]])
            doc.subhead = doc.subhead || COLUMNIST_HEADSHOTS[doc.authorsArray[0]].tagline;
    }
    
    return doc;
}

function cache() {
    if (arguments.length < 2)
        log.error("cache function called with wrong arguments");
    else {
        var args = Array.prototype.slice.call(arguments);
        var func = args.shift();
        var expireTime = args.shift();
        var redisKey = func.toString() + JSON.stringify(args);

        return function (callback) {
            redis.client.get(redisKey, function(err, res) {
                if (!err && res) callback(null, JSON.parse(res));
                else {
                    args.push(function (err, result) {
                        if (err) callback(err);
                        else {
                            redis.client.set(redisKey, JSON.stringify(result));
                            redis.client.expire(redisKey, expireTime);
                            callback(null, result);
                        }
                    })
                    func.apply(this, args);
                }
            });
        };
    }
}
