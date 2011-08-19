var site = {};
var exports = module.exports = site;

var api = require('./api');
var globalFunctions = require('../../global-functions');
var smtp = require('./smtp');
var redis = require('./redisclient');

var _ = require("underscore");
var async = require('async');
var nimble = require('nimble');
var fs = require('fs');
var md = require('node-markdown').Markdown;

var FRONTPAGE_GROUP_NAMESPACE = ['Layouts','Frontpage'];
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

site.init = function(app) {
	api.init();

	app.get('/', function(req, res) {
		api.group.docs(FRONTPAGE_GROUP_NAMESPACE, null, function(err, result) {
			_.defaults(result, homeModel);

			api.docsByDate(5, function(err, docs) {
				homeModel.popular.stories = docs;
				res.render('index', {filename: 'views/index.jade', model: result});
			});
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
	app.get('/article-list/:titleSearch', function(req, http_res, titleSearchQuery) {	
		api.docsByTitleSearch(titleSearchQuery,function(err, docs) {
			if (err) globalFunctions.showError(http_res, err);
			http_res.render('all', {locals:{docs:docs}, layout: 'layout-admin.jade'} );
		});
	});
	
	app.get('/article/:url', function(req, http_res, url) {
		api.docForUrl(url, function(err, doc) {
			if(err) {
				globalFunctions.showError(http_res, err);
			}
			else {
			    if(doc.body) {
				//Convert body markdown to html
				doc.body = md(doc.body);
			    }

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
		

	app.get('/article/:url/edit', site.renderArticleEdit = function(req, http_res, url) {
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

	app.get('/article/:url/image', function(req, httpRes, url) {
    		api.image.getAllOriginals(function(err, origs) {
        		httpRes.render('admin/articleimage', {
	        		filename: 'views/admin/articleimage.jade',
            			locals: {
                			origs: origs,
                			url: url
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
        console.log(postData);
        site.renderSmtpTest(req, http_res, req.body.email, req.body.num);
    });

	return app;
}

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

site.assignLoginFunctionality = function(app) {
	app.post('/login', function(req, res) {
		api.accounts.login(req.session,req.body.username,req.body.password, function(err) {
			if(err) site.askForLogin(res,req.body.afterLogin,req.body.username,err);
			else	res.redirect(req.body.afterLogin);
		});
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
                    http_res.render('mobile', {layout: false, model: [""] } );
                    console.log("sent email");
                });
            });
		});
    }
}
