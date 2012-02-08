var site = exports;

var api = require('./api');
var config = require('../../config');
var globalFunctions = require('../../global-functions');
var log = require('../../log');
var redis = require('../../redisclient');
var route = require('../../route');
var rss = require('./rss');

var _ = require("underscore");
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
		headshot : columnist.headshot,
		tagline : columnist.tagline
	};
});
var BENCHMARK = false;

var twitterFeeds = ["DukeChronicle", "ChronicleRecess", "TowerviewMag", "DukeBasketball", "ChronPhoto", "ChronicleSports"];

site.init = function(callback) {
	LAYOUT_GROUPS = config.get("LAYOUT_GROUPS");
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
	res.render('login', {
		locals : {
			afterLogin : afterLoginPage,
			username : username || '',
			error : err || ''
		},
		layout : 'admin/layout'
	});
};

site.renderConfigPage = function(res, err) {
	if(err) {
		if( typeof err === 'object')
			err = JSON.stringify(err);
		err += "<br /><br />The live site was not updated to use the new configuration due to errors."
	}

	res.render('config/config', {
		locals : {
			configParams : config.getParameters(),
			profileName : config.getProfileNameKey(),
			profileValue : config.getActiveProfileName(),
			revisionName : config.getRevisionKey(),
			revisionValue : config.getConfigRevision(),
			error : err
		},
		layout : 'admin/layout'
	});
};

site.getFrontPageContent = function(callback) {
	var start = Date.now();
	async.parallel([
	function(cb) {//0
		api.group.docs(LAYOUT_GROUPS.Frontpage.namespace, null, function(err, result) {
			if(err)
				return cb(err);
			if(BENCHMARK)
				log.info("API TIME %d", Date.now() - start);
			return cb(null, result);
		});
	},

	function(cb) {//1
		var popularArticles = 7;
		redis.client.zrevrange(_articleViewsKey([]), 0, popularArticles - 1, function(err, popular) {
			if(err)
				return cb(err);
			popular = popular.map(function(str) {
				var parts = str.split('||');
				return {
					urls : ['/article/' + parts[0]],
					title : parts[1]
				};
			});
			if(BENCHMARK)
				log.info("REDIS TIME %d", Date.now() - start);
			cb(null, popular);
		});
	},

	function(cb) {//2
		var twitter = {};
		var selectedFeed = twitterFeeds[Math.floor(Math.random() * twitterFeeds.length)];
		twitter.user = selectedFeed;
		twitter.title = 'Twitter';
		twitter.imageUrl = "http://d2sug25c5hnh7r.cloudfront.net/images/twitter-dukechronicle.png";
		rss.getRSS('twitter-' + selectedFeed, function(err, tweets) {
			if(tweets && tweets.items && tweets.items.length > 0) {
				twitter.tweet = tweets.items[0].title;
			} else {
				twitter.tweet = 'No tweets available.';
			}
			if(BENCHMARK)
				log.info("RSS TIME %d", Date.now() - start);
			return cb(err, twitter);
		});
	}], function(err, results) {
		if(err) {
			log.warning(err);
			callback(err);
		} else {
			if(BENCHMARK)
				log.info("TOTAL TIME %d", Date.now() - start);
			var model = results[0];
			_.defaults(model, homeModel);
			model.popular = results[1];
			model.twitter = results[2];
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
		redis.client.zrevrange(_articleViewsKey(['News']), 0, 3, function(err, popular) {
			if(err)
				cb(err);
			else
				cb(null, popular.map(function(str) {
					var parts = str.split('||');
					return {
						urls : ['/article/' + parts[0]],
						title : parts[1]
					};
				}));
		});
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
			_.defaults(model, newsModel);
			model.popular = results[1];
			model.Blog = results[2]
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
		api.taxonomy.getChildren(['Sports', 'Men'], cb);
	},

	function(cb) {//3
		api.taxonomy.getChildren(['Sports', 'Women'], cb);
	}], function(err, results) {
		if(err) {
			log.warning(err);
			callback(err);
		} else {
			var model = results[0];
			_.defaults(model, sportsModel);
			model.Blog = results[1];
			model.adFullRectangle = {
				"title" : "Advertisement",
				"imageUrl" : "/images/ads/monster.png",
				"url" : "http://google.com",
				"width" : "300px",
				"height" : "250px"
			};
			var children = {
				men : results[2],
				women : results[3]
			};
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
		async.map(columnistsData, function(columnist, _callback) {
			api.authors.getLatest(columnist.user || columnist.name, "Opinion", 5, function(err, res) {
				columnist.stories = res;
				_callback(err, columnist);
			})
		}, cb);
	}], function(err, results) {
		if(err)
			callback(err);
		else {
			var model = results[0];
			if(model.Featured) {
				model.Featured.forEach(function(article) {
					article.author = article.authors[0];
					var columnistObj = null;
					if( columnistObj = columnistsHeadshots[article.author]) {
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
	}], function(err, results) {
		if(err)
			callback(err);
		else {
			var model = results[0];
			model.Blog = results[2];
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
	}], function(err, results) {
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

site.getSectionContent = function(params, callback) {
	var section = _.last(params);
	async.parallel([
	function(cb) {
		redis.client.zrevrange(_articleViewsKey(params), 0, 4, function(err, popular) {
			if(err)
				cb(err)
			else
				cb(null, popular.map(function(str) {
					var parts = str.split('||');
					return {
						urls : ['/article/' + parts[0]],
						title : parts[1]
					};
				}));
		});
	},

	function(cb) {
		api.taxonomy.docs(section, 20, function(err, docs) {
			if(err)
				cb(err)
			else
				modifyArticlesForDisplay(docs, cb);
		});
	},

	function(cb) {
		api.taxonomy.getParents(params, cb);
	},

	function(cb) {
		api.taxonomy.getChildren(params, cb);
	}], function(err, results) {
		if(err)
			callback(err);
		else {
			var popular = results[0];
			var docs = results[1];
			var parents = results[2]
			var children = results[3];
			callback(null, section, docs, children, parents, popular);
		}
	});
};

site.getAuthorContent = function(name, callback) {
	api.search.docsByAuthor(name, 'desc', '', 1, function(err, docs) {
		if(err)
			callback(err);
		else
			modifyArticlesForDisplay(docs, callback);
	});
};

site.getSearchContent = function (wordsQuery, query, callback) {
    api.search.docsBySearchQuery(wordsQuery, query.sort, query.order, query.facets, 1, true, function (err, docs, facets) {
        if (err) callback(err);
        else
            modifyArticlesForDisplay(docs, function (err, docs) {
                if (err) callback(err);
                else {
                    var validSections = globalFunctions.convertObjectToArray(config.get("TAXONOMY_MAIN_SECTIONS"));
                    // filter out all sections other than main sections
                    Object.keys(facets.Section).forEach(function(key) {
                        if (!_.include(validSections, key))
                            delete facets.Section[key];
                    });
                    callback(null, docs, facets);
                }
            });
    });
};

site.getArticleContent = function(url, callback) {
	api.articleForUrl(url, function(err, doc) {
		doc = modifyArticleForDisplay(doc);
		async.parallel([
		    function(cb) {
			    redis.client.zrevrange(_articleViewsKey([]), 0, 4, function(err, popular) {
				    if(err)
					    cb(err);
				    else
					    cb(null, popular.map(function(str) {
						    var parts = str.split('||');
						    return {
							    urls : ['/article/' + parts[0]],
							    title : parts[1]
						    };
					    }));
			    });
		    },
		    function(cb) {
			    api.search.relatedArticles(doc._id, 5, function(err, relatedArticles) {
				    cb(null, relatedArticles);
			    });
		    },
		    function(cb) {
			    api.taxonomy.getParents(doc.taxonomy, function(err, parents) {
				    if(err)
					    cb(err);
				    else
					    cb(null, parents);
			    });
		    }
		], function(err, results) {
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
				};
                var parents = results[2];

                // put callback before statistics so the user doesn't have to wait for statistics to run to see the page			
				callback(null, doc, model, parents);

                // Statistics for most read
				if(doc.taxonomy) {
					var length = doc.taxonomy.length;
					var taxToSend = _.clone(doc.taxonomy);
					var multi = redis.client.multi();
					for(var i = length; i >= 0; i--) {
						taxToSend.splice(i, 1);
						multi.zincrby(_articleViewsKey(taxToSend), 1, _.last(doc.urls) + "||" + doc.title);
					}
					multi.exec(function(err, res) {
						if(err) {
							log.warning("Failed to register article view: " + _.last(doc.urls));
							log.warning(err);
						}
					});
				}
			}
		});
	});
};

site.getPageContent = function(url, callback) {
	api.nodeForTitle(url, function(err, doc) {
		if(err)
			callback(err);
		else {
			doc.path = "/page/" + url;
			doc.fullUrl = "http://dukechronicle.com/page/" + url;
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
function modifyArticlesForDisplay(docs, callback) {
	async.filter(docs, function(doc, cb) {
		modifyArticleForDisplay(doc);
		if(doc.url === undefined)
			cb(null);
		else
			cb(doc);
	}, function(results) {
		callback(null, results);
	});
}

function modifyArticleForDisplay(doc, callback) {
	if(doc.urls) {
		doc.url = '/article/' + _.last(doc.urls);
		doc.fullUrl = 'http://dukechronicle.com' + doc.url;
	}
	if(doc.created)
		doc.date = globalFunctions.formatTimestamp(doc.created, "mmmm d, yyyy");

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
	}
	return doc;
}

function _articleViewsKey(taxonomy) {
	return "article_views:" + config.get("COUCHDB_URL") + ":" + config.get("COUCHDB_DATABASE") + ":" + JSON.stringify(taxonomy);
}
