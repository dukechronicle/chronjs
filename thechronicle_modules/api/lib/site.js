var site = {};
var exports = module.exports = site;

var api = require('./api');
var mobileApi = require('../../mobileapi/mobile_api');
var globalFunctions = require('../../global-functions');

var _ = require("underscore");
var async = require('async');
var nimble = require('nimble');
var fs = require('fs');
var md = require('node-markdown').Markdown;

var FRONTPAGE_GROUP_NAMESPACE = ['section','frontpage'];
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
	api.group.docs(FRONTPAGE_GROUP_NAMESPACE, groupName, function(err, result) {
		var groupDocs = {
			"title": title,
			"stories": []
		};
		result.forEach(function (article, index, array) {
			article.url = "/article/" + article.urls[article.urls.length - 1];
			if (index === 0) article.cssClass = "first";
			if (index === array.length) article.cssClass = "last";
			groupDocs.stories.push(article);
		});

		callback(err, groupDocs);
	});
}

site.renderRoot = function(req, res) {
    fetchGroup("opinion", "Opinion", function(err, groupDocs) {
		homeModel.opinion = groupDocs;
		res.render('index', {filename: 'views/index.jade', model: homeModel});
	});
};

site.renderArticleList = function(req, http_res) {
    api.docsByDate(function(err, docs) {
		if (err) globalFunctions.showError(http_res, err);
		docs = _.map(docs, function(doc) {
			return doc.value;
		});
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
};

site.renderArticle = function(req, http_res) {
    var url = req.params.url;

	api.docForUrl(url, function(err, doc) {
		if(err) {
			globalFunctions.showError(http_res, err);
		} else {
		    if(doc.body) {
		        //Convert body markdown to html
		        doc.body = md(doc.body);
		    }
		    var latestUrl = doc.urls[doc.urls.length - 1];
		    if(url !== latestUrl) {
		        http_res.redirect('/article/' + latestUrl);
		    } else {
		        http_res.render('article', {
					locals: {doc: doc},
			        filename: 'views/article.jade'
				});
		    }
		}
	});
};

site.renderArticleEdit = function(req, http_res) {
    var url = req.params.url;
	
	api.docForUrl(url, function(err, doc) {
		if(err) {
			globalFunctions.showError(http_res, err);
		} else { 
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
		            },
		            function(images, callback) {
		                api.group.list(FRONTPAGE_GROUP_NAMESPACE, function(err, groups) {
		                    callback(err, groups, images);
		                });
		            }
		        ],
		        function(err, groups, images) {
		            if(err) globalFunctions.showError(http_res, err);
		            else {
		                http_res.render('admin/edit', {
				            locals: {
								doc: doc,
								groups: groups,
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
};

site.renderImageList = function(req, httpRes) {
    var url = req.params.url;
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
};

site.renderMobileGroup = function(req, http_res) {
    var groupName = req.params.groupname;
	console.log("server.js/mobile" + groupName);
	if(groupName == "top stories")
	{
		mobileApi.getTopStories(10,function(err, res) {
            console.log(res); 
            var tempModel = JSON.parse(res);
            //api.docsById(res, function(err2, res2){
                //console.log(res2);
               // http_res.render('mobile', {layout: false, model: res2 } );
            //});
            http_res.render('mobile', {layout: false, model: tempModel } );
        });

	}
	else {
		  globalFunctions.showError(http_res, err);
	}
}