var site = {};
var exports = module.exports = site;

var api = require('./api');
var globalFunctions = require('../../global-functions');
var smtp = require('./smtp');
var redis = require('./redisclient');
var config = require('../../config');

var _ = require("underscore");
var async = require('async');
var nimble = require('nimble');
var fs = require('fs');

var FRONTPAGE_GROUP_NAMESPACE = ['Layouts','Frontpage'];
var NEWS_GROUP_NAMESPACE = ['Layouts','News'];
var SPORTS_GROUP_NAMESPACE = ['Layouts','Sports'];
var OPINION_GROUP_NAMESPACE = ['Layouts','Opinion'];
var RECESS_GROUP_NAMESPACE = ['Layouts','Recess'];
var TOWERVIEW_GROUP_NAMESPACE = ['Layouts','Towerview'];

var homeModel = JSON.parse(fs.readFileSync("sample-data/frontpage.json"));

function _getImages(obj, callback) {
    nimble.map(obj, function(val, key, acallback) {
        api.docsById(val, function(err, res) {
            res.imageType = key;
            acallback(err, res)
        });
    },
    callback);
}

function fetchGroup(groupName, title, callback) {
	api.group.docs(FRONTPAGE_GROUP_NAMESPACE, groupName, function(err, res) {
        if (err) 
            console.log(err);
		
		var groupDocs = {
			"title": title,
			"stories": []
		};
        if (res) {
            res.forEach(function (article, index, array) {
                // canonical url is the last element of the url array
                article.url = "/article/" + article.urls[article.urls.length - 1];
                if (index === 0) article.cssClass = "first";
                if (index === array.length) article.cssClass = "last";
                
                groupDocs.stories.push(article);
            });
            callback(err, groupDocs);
        }
	});
}

site.init = function(app, callback) {
	redis.init(function(err) {
        if(err)
        {
            console.log("redisclient init failed!");
            return callback(err);
        }

        api.init(function(err2){
            if(err2)
            {
                console.log("api init failed!");
                return callback(err2);
            }
            app.get('/', function(req, res) {
                api.group.docs(FRONTPAGE_GROUP_NAMESPACE, null, function(err, result) {
                    _.defaults(result, homeModel);

                    api.docsByDate(5, function(err, docs) {
                        homeModel.popular.stories = docs;
                        res.render('site/index', {filename: 'views/site/index.jade', model: result});
                    });
                });
            });

            app.get('/news', function(req, res) {
                api.group.docs(NEWS_GROUP_NAMESPACE, null, function(err, result) {
                    res.render('site/news', {filename: 'views/site/news.jade', model: result});
                });
            });

            app.get('/sports', function(req, res) {
                api.group.docs(SPORTS_GROUP_NAMESPACE, null, function(err, result) {
                    res.render('site/sports', {filename: 'views/site/sports.jade', model: result});
                });
            });

            app.get('/opinion', function(req, res) {
                api.group.docs(OPINION_GROUP_NAMESPACE, null, function(err, result) {
                    res.render('site/opinion', {filename: 'views/site/opinion.jade', model: result});
                });
            });

            app.get('/recess', function(req, res) {
                api.group.docs(RECESS_GROUP_NAMESPACE, null, function(err, result) {
                    res.render('site/recess', {filename: 'views/site/recess.jade', model: result});
                });
            });

            app.get('/towerview', function(req, res) {
                api.group.docs(TOWERVIEW_GROUP_NAMESPACE, null, function(err, result) {
                    res.render('site/towerview', {filename: 'views/site/towerview.jade', model: result});
                });
            });

            app.get('/article-list', function(req, http_res) {
                    api.docsByDate(null, function(err, docs) {
                    if (err) globalFunctions.showError(http_res, err);
                    http_res.render('all', {locals:{docs:docs}, layout: 'layout-admin.jade'} );
                });

                /*
                api.group.list(['section'], function(err, groups) {
                    if(err) {
                        globalFunctions.showError(http_res, err);
                    } else {
                        api.group.docs(['section'], groups, function(get_err, get_res) {
                            get_res.forEach(function(article) {
                                console.log(article.urls.length);
                            })
                            if(get_err) {
                                globalFunctions.showError(http_res, get_err);
                            } else {
                                http_res.render('main', {
                                    locals: {
                                        docs: get_res
                                    }
                                });
                            }
                        });
                    }
                });*/
            });

            // test the solr search functionality. Currently returns the ids,score of articles containing one of more of search words in title.
            app.get('/article-list/:titleSearchQuery', function(req, http_res) {
                api.docsByTitleSearch(req.params.titleSearchQuery,function(err, docs) {
                    if (err) globalFunctions.showError(http_res, err);
                    http_res.render('all', {locals:{docs:docs}, layout: 'layout-admin.jade'} );
                });
            });

            app.get('/article/:url', function(req, http_res) {
                var url = req.params.url;

                api.docForUrl(url, function(err, doc) {
                    if(err) {
                        globalFunctions.showError(http_res, err);
                    }
                    else {
                           // convert timestamp
                           if (doc.created) {
                            var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
                                "October", "November", "December"];
                            var timestamp = doc.created;
                            var date = new Date(timestamp*1000);
                            doc.date = month[date.getMonth()] + " " + date.getDay() + ", " + date.getFullYear();
                          }

                      // format authors
                      if (doc.authors && doc.authors.length > 0) {
                        /*
                        doc.authors.map(function(author) {
                            return "<a href='/staff/" + author + "'>" + author + "</a>";
                        })*/

                        doc.authorsHtml = doc.authors[0];
                        /*
                        var count = doc.authors.length;
                        doc.authors.forEach(function(author, index) {
                            if (index > 0) {

                            }
                        });*/
                      }
                      console.log(doc.authorsHtml);

                      var latestUrl = doc.urls[doc.urls.length - 1];

                      if(url !== latestUrl) {
                        http_res.redirect('/article/' + latestUrl);
                      }
                      else {
                        doc.fullUrl = "http://dukechronicle.com/article/" + latestUrl;
                        http_res.render('article', {
                            locals: {doc: doc},
                            filename: 'views/article.jade'
                        });
                     }
                    }
                   });
            });

            app.get('/article/:url/edit', site.renderArticleEdit = function(req, http_res) {
                var url = req.params.url;

                api.docForUrl(url, function(err, doc) {
                    if(err) {
                        globalFunctions.showError(http_res, err);
                    }
                    else {
                            if(req.query.deleteImage) {
                                var newImages = doc.images;
                                delete newImages[req.query.deleteImage];
                                api.editDoc(doc._id, newImages, function(editErr, res) {
                                        if(editErr) globalFunctions.showError(http_res, editErr);
                                        else http_res.redirect('/article/' + url + '/edit');
                                });
                            }
                            else {
                                if(!doc.images) doc.images = {};

                            async.waterfall([
                                function(callback) {
                                _getImages(doc.images, callback);
                                }/*,

                                function(images, callback) {
                                    /*
                                api.group.list(FRONTPAGE_GROUP_NAMESPACE, function(err, groups) {
                                    callback(err, groups, images);
                                });*/
                                //}
                            ],
                            function(err, images) {
                            //function(err, groups, images) {
                                if(err) globalFunctions.showError(http_res, err);
                                else {
                                http_res.render('admin/edit', {
                                    locals: {
                                            doc: doc,
                                            //groups: groups,
                                                groups: [],
                                            images: images,
                                            url: url
                                    },
                                    layout: "layout-admin.jade"
                                });
                                }
                                });
                            }
                    }
                });
            });

            app.get('/article/:url/image', function(req, httpRes) {
                    api.image.getAllOriginals(function(err, origs) {
                        httpRes.render('admin/articleimage', {
                            filename: 'views/admin/articleimage.jade',
                                locals: {
                                    origs: origs,
                                    url: req.params.url
                                },
                            layout: 'layout-admin.jade'
                        });
                    });
            });

            app.get('/login', function(req, res) {
                site.askForLogin(res,'/');
            });

            app.get('/smtp', function(req, http_res) {
                http_res.render('smtp', {layout: false, model: [""] } );
            });

            app.post('/smtp', function(req, http_res) {
                var postData = req.body;
                site.renderSmtpTest(req, http_res, req.body.email, req.body.num);
            });

            callback(null);
        });
    });
}

// redirects to login page
site.askForLogin = function(res,afterLoginPage,username,err) {
	if(err == null) err = '';
	if(username == null) username = '';

	res.render('login', {
		locals: {
			afterLogin:afterLoginPage,
			username:username,
			error:err
		},
		layout: 'layout-admin.jade'
	});
}

// assigns the functionality needed before different modules are ready to be initilized (before config settings have been set)
site.assignPreInitFunctionality = function(app,server) {
	app.post('/login', function(req, res) {
		api.accounts.login(req,req.body.username,req.body.password, function(err) {
			if(err) site.askForLogin(res,req.body.afterLogin,req.body.username,err);
			else	res.redirect(req.body.afterLogin);
		});
	});

    app.get('/logout', function(req, res) {
		api.accounts.logOut(req, function(err) {
			  if(err) console.log(err);
              res.redirect('/');
		});
	});

	app.get('/config', function(req, res) {
		if(api.accounts.isAdmin(req)) {					
			res.render('config/config', {
				locals: {
					configParams:config.getParameters(),
					profileName:config.getProfileNameKey(),
					profileValue:config.getActiveProfileName()
				},
				layout: 'layout-admin.jade'
			});
		}
		else {
			site.askForLogin(res,'/config');
		}
	});

	app.post('/config', function(req, res) {
		if(api.accounts.isAdmin(req)) {
			config.setUp(req.body, function(err) {
				if(err == null) {
                    server.runSite(function() {
				        res.redirect('/');
                    });
                }
                else {
                    res.redirect('/');
                }
			});
		}
		else {
			site.askForLogin(res,'/config');
		}
	});
}


site.renderSmtpTest = function(req, http_res, email, num) {
    console.log("rendersmtptest");
    if(num == 1)
        smtp.addSubscriber(email, function(err, docs) {
            if (err) 
                globalFunctions.showError(http_res, err);
            http_res.render('mobile', {layout: false, model: [""] } );
            console.log("added");
        });
    else if (num == 2)
        smtp.removeSubscriber(email, function(err, docs) {
            if (err)
                globalFunctions.showError(http_res, err);
            http_res.render('mobile', {layout: false, model: [""] } );
            console.log("removed");
        });
    else if (num == 3)
    {
        api.group.docs(FRONTPAGE_GROUP_NAMESPACE, null, function(err, result) {
            _.defaults(result, homeModel);

            api.docsByDate(5, function(err, docs) {
                smtp.sendNewsletter(docs, function(err2,res2) {
                    http_res.send(res2);
                    console.log("sent email");
                });
            });
		});
    }
}
