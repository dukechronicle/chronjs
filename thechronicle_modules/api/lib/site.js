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

var LAYOUT_GROUPS;
var twitterFeeds = [];
var BENCHMARK = false;

site.modifyArticleForDisplay = modifyArticleForDisplay;

site.init = function () {
    LAYOUT_GROUPS = config.get("LAYOUT_GROUPS");

    twitterFeeds = _.filter(config.get("RSS_FEEDS"), function(rssFeed) {
        return rssFeed.url.indexOf("api.twitter.com") !== -1;
    });
};

// Checks if you are an admin with browser check
site.checkAdmin = function(req, res, next) {
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

    res.render('admin/config', {
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

site.getQdukeContent = util.cache(300, function (callback) {
    async.parallel([
        function (cb) { //0
            api.group.docs(LAYOUT_GROUPS.Frontpage.namespace, null, function (err, result) {
                if (err) return cb(err);
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
        }
    ], function (err, results) {
        if (err) {
            log.warning(err);
            callback(err);
        }
        else {
            var model = results[0];
            model.Popular = results[1];
            callback(null, model);
        }
    });
});

site.getFrontPageContent = util.cache(300, function(callback) {
    var start = Date.now();
    async.parallel([
        function (cb) { //0
            api.group.docs(LAYOUT_GROUPS.Frontpage.namespace, null, function (err, result) {
                if (err) return cb(err);
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
});

site.getNewsPageContent = util.cache(300, function(callback) {
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
    }], function(err, results) {
        if(err) {
            log.warning(err);
            callback(err);
        } else {
            var model = results[0];
            model.popular = results[1];
            model.Blog = results[2];
            model.multimedia = config.get('MULTIMEDIA_HTML');
            model.children = api.taxonomy.children(['News']);
            callback(null, model);
        }
    });
});

site.getSportsPageContent = util.cache(300, function(callback) {
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
        }], function(err, results) {
        if(err) {
            log.warning(err);
            callback(err);
        } else {
            var model = results[0];
            model.Blog = results[1];
            model.multimedia = config.get('MULTIMEDIA_HTML');
            model.children = api.taxonomy.children(['Sports']);
            callback(null, model);
        }
    });
});

site.getOpinionPageContent = util.cache(300, function(callback) {
    async.parallel([
    function(cb) {//0
        api.group.docs(LAYOUT_GROUPS.Opinion.namespace, null, cb);
    },

    function(cb) {//1
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

    function(cb) {//2
        api.article.getByTaxonomy(['Opinion', 'Editorial Board'], 5, null, function (err, res) {
            cb(err, res);
        });
    },

    function(cb) {//3
        api.authors.getColumnists(function(err, columnists) {
            async.map(columnists, function(columnist, _callback) {
                api.authors.getLatest(columnist.user || columnist.name, ['Opinion'], 7, function(err, res) {
                    columnist.stories = modifyArticlesForDisplay(res);
                    _callback(err, columnist);
                })
            }, cb);
        });
    }], function(err, results) {
            if(err)
                callback(err);
            else {
                // maps columnist headshots to name for use on rest of page
                columnistHeadshots = {};
                results[3].forEach(function(columnist) {
                    columnist.url = '/staff/' + columnist.name;
                    var name = columnist.name.toLowerCase();
                    columnistHeadshots[name] = {tagline : columnist.tagline};
                    if (columnist.images && columnist.images.StaffHeadshot)
                        columnistHeadshots[name].headshot = columnist.images.StaffHeadshot.url;
                });


                var model = results[0];
                if (model.Featured) {
                    model.Featured.forEach(function(article) {
                        article.author = article.authors[0];
                        var columnistObj = null;
                        if( columnistObj = columnistHeadshots[article.author.toLowerCase()]) {
                            if(columnistObj.headshot)
                                article.thumb = columnistObj.headshot;
                            if(columnistObj.tagline)
                                article.tagline = columnistObj.tagline;
                        }
                    });
                }
                model.Blog = results[1];
                model.EditorialBoard = modifyArticlesForDisplay(results[2]);
                model.Columnists = {};
                // assign each columnist an object containing name and stories to make output jade easier
                results[3].forEach(function(columnist, index) {
                    model.Columnists[index] = columnist;
                });
                // need to call compact to remove undefined entries in array
                _.compact(model.Columnists);

                model.children = api.taxonomy.children(['Opinion']);
                callback(null, model);
            }
        });
});

site.getRecessPageContent = util.cache(300, function(callback) {
    async.parallel([
    function(cb) {
        api.group.docs(LAYOUT_GROUPS.Recess.namespace, null, cb);
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
            model.Blog = results[1];
            model.multimedia = config.get('MULTIMEDIA_HTML');
            model.children = api.taxonomy.children(['Recess']);

            callback(null, model);
        }
    });
});

site.getTowerviewPageContent = util.cache(300, function(callback) {
    async.parallel([
    function(cb) {
        api.group.docs(LAYOUT_GROUPS.Towerview.namespace, null, cb);
    }],
    function(err, results) {
        if(err)
            callback(err);
        else {
            var model = results[0];
            model.children = api.taxonomy.children(['Towerview']);
            callback(null, model);
        }
    });
});

site.getSectionContent = function (params, callback) {
    async.parallel([
        function(cb) {
            popular.getPopularArticles(params, 5, cb);
        },
        function (cb) {
            api.article.getByTaxonomy(params, 20, null, function (err, docs, next) {
                if (err) cb(err)
                else cb(null, {docs:modifyArticlesForDisplay(docs), next:next});
            });
        }], function (err, results) {
            if (err)
                callback(err);
            else {
                var section = api.taxonomy.getTaxonomy(params);
                var popular = results[0];
                var docs = results[1].docs;
                var next = results[1].next;
                var parents = api.taxonomy.parents(params);
                var children = api.taxonomy.children(params);
                callback(null, section, docs, next, children, parents, popular);
            }
        }
    );
};

site.getAuthorContent = function(name, callback) {
    async.parallel([
        function(cb) {
            api.article.getByAuthor(name, null, null, null, function(err, docs, next) {
                if(err) cb(err);
                else cb(null, {docs:modifyArticlesForDisplay(docs), next:next});
            });
        },
        function(cb) {
            api.authors.getInfo(name, cb);
        }], function (err, results) {
            if (err)
                callback(err);
            else {
                var docs = results[0].docs;
                var next = results[0].next
                var info = results[1][0];
                callback(null, docs, info, next);
            }
        }
    );
};

site.getSearchContent = function (wordsQuery, query, callback) {
    api.search.docsBySearchQuery(wordsQuery, query.sort, query.order, query.facets, 1, true, function (err, docs, facets) {
        if (err) callback(err);
        else {
            docs = modifyArticlesForDisplay(docs);
            var validSections = api.taxonomy.mainSections();
            // filter out all sections other than main sections
            Object.keys(facets.Section).forEach(function(key) {
                if (!_.include(validSections, key))
                    delete facets.Section[key];
            });
            callback(null, docs, facets);
        }
    });
};

site.getArticleContent = util.cache(300, function(url, callback) {
    api.article.getByUrl(url, function(err, doc) {
        if (err) return callback('not found');
        var displayDoc = modifyArticleForDisplay(doc);
        async.parallel({
            popular: function(cb) {
                popular.getPopularArticles([], 5, cb);
            },
            related: function(cb) {
                api.search.relatedArticles(doc._id, 5, function(err, relatedArticles) {
                    if (err) {
                        log.error('Solr error', err);
                        return cb(null, []);
                    }
                    else cb(null, modifyArticlesForDisplay(relatedArticles));
                });
            },
            poll: function (cb) {
                api.poll.getByTaxonomy(doc.taxonomy, 1, function (err, res) {
                    if (err) cb(err);
                    else if (res.length == 0) cb();
                    else cb(null, res[0]);
                });
            }
        }, function (err, model) {
            if (err) return callback(err);
            model.doc = displayDoc;
            model.parents = api.taxonomy.parents(doc.taxonomy);
            popular.registerArticleView(doc, function(err,res){});
            callback(err, model);
        });
    });
});

site.getPageContent = util.cache(300, function (url, callback) {
    api.page.getByUrl(url, function (err, page) {
        if (err) callback(err);
        else if (!page) callback();
        else {
            api.page.generateModel(page, function (err, model) {
                if (err) return callback(err);
                page.view = api.page.view(page);
                page.model = model;
                callback(null, page);
            });
        }
    });
});

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

    doc.body = api.article.renderBody(doc.body);

    return doc;
}
