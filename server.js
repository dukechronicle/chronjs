/* declare global configuration variables */
var PORT = process.env.PORT || 4000;
var FRONTPAGE_GROUP_NAMESPACE = ['section'];

var config = require('./thechronicle_modules/config');

config.sync(function() {
	/* require npm nodejs modules */
	var fs = require('fs');
	var express = require('express');
	require('express-namespace');
	var stylus = require('stylus');
	var async = require('async');

	/* require internal nodejs modules */
	var globalFunctions = require('./thechronicle_modules/global-functions');
	var api = require('./thechronicle_modules/api/lib/api');
	var admin = require('./thechronicle_modules/admin/lib/admin');

	/* mobile stuff */
	var mobileApi = require('./thechronicle_modules/mobileapi/mobile_api');

	/* express configuration */
	var app = express.createServer();

	var publicDir = '/public';
	var viewsDir = '/views';

	function compile(str, path) {
	  return stylus(str)
		.set('filename', path)
		.set('compress', true);
	}

	// add the stylus middleware, which re-compiles when
	// a stylesheet has changed, compiling FROM src,
	// TO dest. dest is optional, defaulting to src

	app.use(stylus.middleware({
		src: __dirname + viewsDir
	  , dest: __dirname + publicDir
	  , compile: compile
	}));

	app.set('view engine', 'jade');

	// the middleware itself does not serve the static
	// css files, so we need to expose them with staticProvider
	app.use(express.static(__dirname + publicDir));
	app.use(express.bodyParser());

	app.set('views', __dirname + viewsDir);

	app.error(function(err, req, res, next){
		res.send(500);
		globalFunctions.log('ERROR: ' + err.stack);
	});

	var homeModel = JSON.parse(fs.readFileSync("sample-data/frontpage.json"));

	/*** FRONTEND ***/
	app.get('/', function(req, res) {
		res.render('index', {filename: 'views/index.jade',layout: false, model: homeModel});
	});

	app.get('/article-list', function(req, http_res) {
		api.group.list(FRONTPAGE_GROUP_NAMESPACE, function(err, groups) {
			if(err) {
				globalFunctions.showError(http_res, err);
			} else {
				api.group.docs(FRONTPAGE_GROUP_NAMESPACE, groups, function(get_err, get_res) {
					if(get_err) {
						globalFunctions.showError(http_res, get_err);
					} else {
						http_res.render('main', {
							locals: {
								groups: get_res
							}
						});
					}
				});
			}
		});
	});

	app.get('/article/:url', function(req, http_res) {
		var url = req.params.url;

		api.docForUrl(url, function(err, doc) {
			if(err) {
				globalFunctions.showError(http_res, err);
			} else {
			    var latestUrl = doc.urls[doc.urls.length - 1];
			    if(url !== latestUrl) {
			        http_res.redirect('/article/' + latestUrl);
			    } else {
			        http_res.render('article', {
    					locals: {doc: doc}
    				});
			    }
			}
		});
	});

	app.get('/article/:url/edit', function(req, http_res) {
		var url = req.params.url;
		api.docForUrl(url, function(err, doc) {
			if(err) {
				globalFunctions.showError(http_res, err);
			} else { 
			    if(req.query.image) {
			        api.addToDocArray(doc._id, 'images', req.query.image, function(err, res) {
			            if(err) {
			                globalFunctions.showError(http_res, err);
			            } else {
			                http_res.redirect('/article/' + url + '/edit');
			            }
			        })
			    } 
			    else if(req.query.deleteImage) {
			        api.removeFromDocArray(doc._id, 'images', req.query.deleteImage, function(err, res) {
			            if(err) {
			                globalFunctions.showError(http_res, err);
			            } else {
			                http_res.redirect('/article/' + url + '/edit');
			            }
			        })
			    }
			    else {
			        api.docsById(doc.images, function(err, images) {
			            if(err) {
			                globalFunctions.showError(http_res, err);
			            } else {
			                api.group.list(['section'], function(group_err, groups) {
            					if(group_err) {
            						globalFunctions.showError(http_res, group_err);
            					} else {
            						http_res.render('admin/edit', {
            							locals: {doc: doc,
            									 groups: groups,
            									 images: images,
            									 url: url}
            						});
            					}
            				});
			            }
			        })
			    }
			}
		});
	});
	
	app.get('/article/:url/image', function(req, httpRes) {
	    var url = req.params.url;
	    api.image.getAllOriginals(function(err, origs) {
	        httpRes.render('admin/articleimage', {
	            locals: {
	                origs: origs,
	                url: url
	            }
	        });
	    });
	});

	app.get('/mobile/:groupname', function(req, http_res) {
		var groupName = req.params.groupname;
		console.log("server.js/mobile" + groupName);
		if(groupName == "top stories")
		{
			mobileApi.getTopStories(10,function(err, res) {
				console.log(res);
				globalFunctions.sendJSONResponse(http_res, res);
			}
			);

		}
		else {
			  globalFunctions.showError(http_res, err);
		}

	});
	/*** !FRONTEND ***/
	
	/*** ADMIN ***/
	app = admin.init(app);

	/*** !ADMIN ***/

	console.log('Listening on port ' + PORT);
	app.listen(PORT);
});