var api = require('../../api');
var globalFunctions = require('../../global-functions');
var async = require('async');
var fs = require('fs');
var s3 = require('./s3.js');
var im = require('imagemagick');

var EXTENSIONS = {};
EXTENSIONS['image/jpeg'] = 'jpg';
EXTENSIONS['image/png'] = 'png';
EXTENSIONS['image/gif'] = 'gif';

var THUMB_DIMENSIONS = '100x100';
var FRONTPAGE_GROUP_NAMESPACE = ['section'];

function _getS3Filename(imageName, addition, type) {
    return imageName + addition + '.' + EXTENSIONS[type];
}

function _getMagickString(x1, y1, x2, y2) {
    var w = x2 - x1;
    var h = y2 - y1;
    return w.toString() + 'x' + h.toString() + '+' + x1.toString() + '+' + y1.toString();
}

exports.init = function(app) {
	app.namespace('/admin', function() {
		app.get('/addgroup', function(req, http_res) {
		    api.group.create(FRONTPAGE_GROUP_NAMESPACE, req.query.addgroup, function(err, res) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            http_res.redirect('/admin/add');
		        }
		    })
		});
		
		app.get('/add', function(req, http_res) {
		    api.group.list(FRONTPAGE_GROUP_NAMESPACE, function(err, groups) {
			    if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
					http_res.render('admin/add', {
						locals: {groups: groups}
					});
			    }
		    })
		});
		
		app.get('/manage', function(req, http_res) {
		    api.docsByDate(function(err, res) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            http_res.render('admin/manage', {
		                locals: {docs: res}
		            });
		        }
		    });
		});
		
		app.get('/upload', function(req, httpRes) {
		    httpRes.render('test-upload');
		});
		
		app.post('/upload', function(req, httpRes) {
		    
		    var imageData = req.body.imageData;
    		var imageName = req.body.imageName;
    		// create a unique name for the image to avoid s3 blob collisions
			imageName = globalFunctions.randomString(8)+"-"+imageName;
			var thumbName = 'thumb_' + imageName;
    		var imageType = req.body.imageType;
    		var imageID = req.body.imageID;

    		// use async library to call these functions in series, passing vars between them
    		async.waterfall([
    			function(callback) {
    				if(imageType != 'image/jpeg' && imageType != 'image/png' && imageType != 'image/gif') {
    					callback("Invalid file type for " + imageName + ". Must be an image.");
    				}
    				else {
    					callback(null)
    				}
    			},
    			function(callback) {
    				var buf = new Buffer(imageData, 'base64');
    				fs.writeFile(imageName, buf, function(err) {
    					callback(err);
    				});
    			},
    			function(callback) {
    				fs.readFile(imageName, function (err, data) {
    					callback(err,data);
    				});
    			},
    			function(data, callback) {
    				//put image in AWS S3 storage
    				s3.put(data, imageName, imageType, function(err, url) {
    					callback(err,url);
    				});
    			},
    			function(url, callback) {
    			    im.convert([imageName, '-thumbnail', THUMB_DIMENSIONS, thumbName], function(imErr, stdout, stderr) {
    			        callback(imErr, url);
    			    });
    			},
    			function(url, callback) {
    			    fs.readFile(thumbName, function(err, data) {
    			        callback(err, url, data);
    			    });
    			},
    			function(url, data, callback) {
    			    s3.put(data, thumbName, imageType, function(err, thumbUrl) {
    					callback(err, url, thumbUrl);
    				});
    			},
    			function(url, thumbUrl, callback) {
    				api.image.createOriginal(imageName, url, imageName, imageType, {
    				    thumbUrl: thumbUrl,
    					photographer: 'None',
    					caption: 'None',
    					date: 'None',
    					location: 'None'
    				},
    				function(err, res) {
    					callback(err, res, url);
    				});
    			},
    		],
    		function(err,result,url) {
    			if(err) {
    				globalFunctions.log(err);

    				if(typeof(err) == "object") {
    					err = "Error";
    				}

    				globalFunctions.sendJSONResponse(httpRes, {
    					error: err,
    					imageID: imageID
    				});
    			}
    			else {
    				globalFunctions.log('Image uploaded: ' + url + ' and stored in DB: ' + result);
    				globalFunctions.sendJSONResponse(httpRes, {
    					imageID: imageID,
    					imageName: imageName
    				});
    			}
    		});
		});
		
		app.get('/image/:imageName', function(req, httpRes) {
		    var imageName = req.params.imageName;
		    api.image.getOriginal(imageName, function(err, orig) {
		        if(err) globalFunctions.showError(httpRes, err);
		        else {
		            api.docsById(orig.value.imageVersions, function(err2, versions) {
		                if(err2) globalFunctions.showError(httpRes, err2);
		                else {
		                    httpRes.render('admin/image', {
            		            locals: {
            		                url: orig.value.url,
            		                name: imageName,
					id: orig.value._id,
					caption: orig.value.caption,
					location: orig.value.location,
					photographer: orig.value.photographer,
					date: orig.value.date,
            		                versions: versions
            		            }
            		        });
		                }
		            })
		        }
		    });
		});

		app.post('/image/info', function(req, httpRes) {
		    var data = {};
		    var id = req.body.id;
		    data.name = req.body.name;
		    data.date = req.body.date;
		    data.caption = req.body.caption;
		    data.photographer = req.body.photographer;
	 	    data.location = req.body.location;

		    api.image.edit(id,data, function(){
		    	httpRes.redirect('/admin/image/'+data.name);
		    });
		    
		});
		
		app.post('/image/crop', function(req, httpRes) {
		    var imageName = req.body.name;
		    api.image.getOriginal(imageName, function(err, orig) {
		        if(err) globalFunctions.showError(httpRes, err);
		        else {
		            var path = orig.value.localPath;
		            var dest = 'crop_' + path;
		            var geom = _getMagickString(
		                parseInt(req.body.x1),
		                parseInt(req.body.y1),
		                parseInt(req.body.x2),
		                parseInt(req.body.y2));
		            var width = req.body.x2 - req.body.x1;
		            var height = req.body.y2 - req.body.y1;
		            im.convert([path, '-crop', geom, dest], function(imErr, stdout, stderr) {
		                if(imErr) globalFunctions.showError(httpRes, imErr);
		                else {
		                    var versionNum = orig.value.imageVersions.length + 1;
		                    var type = orig.value.contentType;
		                    var s3Name = _getS3Filename(imageName, versionNum.toString(), type);
		                    fs.readFile(dest, function(readErr, buf) {
		                        if(readErr) globalFunctions.showError(httpRes, readErr);
		                        else {
		                            s3.put(buf, s3Name, type, function(s3Err, url) {
		                                if(s3Err) globalFunctions.showError(httpRes, s3Err);
		                                else {
		                                    api.image.createVersion(orig.id, url, width, height,
		                                    function(dbErr, dbRes) {
		                                        if(dbErr) globalFunctions.showError(httpRes, dbErr);
		                                        else httpRes.redirect('/admin/image/' + imageName);
		                                    })
		                                }
		                            })
		                        }
		                    })
		                }
		            })
		        }
		    })
		});
		
		app.post('/edit', function(req, http_res) {
		    var id = req.body.doc.id;
		    var new_groups = req.body.doc.groups;
		    if(!(new_groups instanceof Array)) { //we will get a string if only one box is checked
		        new_groups = [new_groups];
		    }
		    var fields = {
		        title: req.body.doc.title,
		        body: req.body.doc.body,
		        groups: new_groups
		    };
		    api.editDoc(id, fields, function(err, res) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            http_res.redirect('/article/' + res.merge[1] + '/edit');
		        }
		    });
		});
		
		app.post('/add', function(req, http_res) {
		    var fields = {body: req.body.doc.body};
		    api.addDoc(fields, req.body.doc.title, function(err, res, url) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            var groups = req.body.doc.groups;
		            if(groups) {
		                var fcns = [];
		                if(!(groups instanceof Array)) { //we will get a string if only one box is checked
		                    groups = [groups];
		                }
		                async.map(groups, function(group) {
		                	return ['section'].push(group);
		                }, function(err, groups) {
		                	console.log(groups)
		                	api.group.add(res.id, groups, function(add_err, add_res) {
			                    if(add_err) {
			                        globalFunctions.showError(http_res, add_err);
			                    } else {
			                        http_res.redirect('article/' + url);
			                    }
			                });
		                })
		                
		                
		            } else {
		                http_res.redirect('article/' + url);
		            }
		        }
		    });
		});
	});
	
	return app;
}
