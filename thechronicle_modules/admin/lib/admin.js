var api = require('../../api');
var globalFunctions = require('../../global-functions');
var async = require('async');
var fs = require('fs');
var s3 = require('./s3.js');
var im = require('imagemagick');
var http = require('http');
var urlModule = require('url');
var solr = require('solr');
var md = require('node-markdown').Markdown;
var sprintf = require('sprintf').sprintf;
var config = require("../../config");
var site = require('../../api/lib/site.js');

var VALID_EXTENSIONS = {};
VALID_EXTENSIONS['image/jpeg'] = 'jpg';
VALID_EXTENSIONS['image/png'] = 'png';
VALID_EXTENSIONS['image/gif'] = 'gif';

var IMAGE_TYPES = ['article', 'frontpage', 'slideshow'];
var CROP_SIZES = {
    large: {
        width: 636,
        height: 393
    },
    square: {
        width: 300,
        height: 300
    }
};

var THUMB_DIMENSIONS = '100x100';

var FRONTPAGE_GROUP_NAMESPACE = ['Layouts','Frontpage'];
var NEWS_GROUP_NAMESPACE = ['Layouts','News'];
var SPORTS_GROUP_NAMESPACE = ['Layouts','Sports'];
var OPINION_GROUP_NAMESPACE = ['Layouts','Opinion'];
var RECESS_GROUP_NAMESPACE = ['Layouts','Recess'];
var TOWERVIEW_GROUP_NAMESPACE = ['Layouts','Towerview'];

var VIDEO_PLAYERS = {
    "youtube": "<iframe width=\"560\" height=\"345\" src=\"http://www.youtube.com/embed/%s\" frameborder=\"0\" allowfullscreen></iframe>",
    "vimeo": "<iframe src=\"http://player.vimeo.com/video/%s?title=0&amp;byline=0&amp;portrait=0\" width=\"400\" height=\"225\" frameborder=\"0\"></iframe>"
};
var REGEX_FORMAT = "(\{%s:)([^}]+)(\})";

function _renderBody(body, cbck) {
    
    async.waterfall([
    function(callback) {
        for(name in VIDEO_PLAYERS) {
            var pattern = new RegExp(sprintf(REGEX_FORMAT, name), 'g');
            body = body.replace(pattern, function(match) {
                return sprintf(VIDEO_PLAYERS[name], RegExp.$2);
            });
        }
        callback(null, body);
    },
    function(replaced, callback) {
        callback(null, md(replaced));
    }
    ],
    cbck);
}

function _getMagickString(x1, y1, x2, y2) {
    var w = x2 - x1;
    var h = y2 - y1;
    return w.toString() + 'x' + h.toString() + '+' + x1.toString() + '+' + y1.toString();
}

function _downloadUrlToPath(url, path, callback) {
    var urlObj = urlModule.parse(url);
    console.log('host: ' + urlObj.host);
    var options = {
        host: urlObj.host,
        port: 80,
        path: urlObj.pathname
    };
    http.get(options, function(res) {
        res.setEncoding('binary');
        var data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            fs.writeFile(path, data, 'binary', function(err) {
                callback(err);
            });
        });
    });
}

function _deleteFiles(paths, callback) {
    async.reduce(paths, [], function(memo, item, callback) {
        memo.push(function(acallback) {
            fs.unlink(item, acallback);
        });
        callback(null, memo);
    },
    function(err, result) {
        async.series(result, callback);
    });
}

exports.init = function(app, callback) {
    s3.init(function(err) {
        if (err)
        {
            console.log("S3 init failed!");
            return callback(err);
        }
        
        //Run this to render bodies for all articles
        /*
        api.docsByDate(null, function(err, docs) {
            console.log("Got docs");
            docs.forEach(function(doc, index) {
                _renderBody(doc.body, function(err, rendered) {
                    api.editDoc(doc._id, {
                        renderedBody: rendered
                    }, 
                    function(err) {
                        console.log("Updating " + index + " of " + docs.length);
                    });
                });
            });
        });
        */
        
        app.namespace('/admin',
        function() {
            app.get('/layout/frontpage', site.checkAdmin,
				function(req, res) {
					function renderPage(docs) {
						var stories = docs;
						api.group.docs(FRONTPAGE_GROUP_NAMESPACE, null,
						function(err, model) {
							res.render('admin/layout/frontpage', {
								layout: "layout-admin.jade",
								locals: {
									stories: stories,
									model: model
								}
							});
						});
					}
					// TODO make requests concurrent
					var filter = req.param("section", null);
					if (filter) {
						api.taxonomy.docs(filter, 20,
						function(err, docs) {
							if (err) globalFunctions.showError(res, err);
							else {
								docs = docs.map(function(doc) {
									return doc;
								});
								renderPage(docs);
							}
						});
					} else {
						api.docsByDate(20,
						function(err, docs) {
							if (err) globalFunctions.showError(res, err);
							renderPage(docs);
						});
					}
				}
            );

	        app.get('/layout/news', site.checkAdmin,
				function(req, res) {
					function renderPage(docs) {
						var stories = docs;
						api.group.docs(NEWS_GROUP_NAMESPACE, null,
						function(err, model) {
							res.render('admin/layout/news', {
								layout: "layout-admin.jade",
								locals: {
									stories: stories,
									model: model
								}
							});
						});
					}
					// TODO make requests concurrent
					var filter = req.param("section", null);
					if (filter) {
						api.taxonomy.docs(filter, 20,
						function(err, docs) {
							if (err) globalFunctions.showError(res, err);
							else {
								docs = docs.map(function(doc) {
									return doc;
								});
								renderPage(docs);
							}
						});
					} else {
						api.docsByDate(20,
						function(err, docs) {
							if (err) globalFunctions.showError(res, err);
							renderPage(docs);
						});
					}
				}
            );

            app.post('/layout/frontpage', site.checkAdmin,
            function(req, res) {
                res.render('/');
            });

            app.post('/group/add', site.checkAdmin,
            function(req, res) {
                var _res = res;

                var docId = req.body.docId;
                var nameSpace = req.body.nameSpace;
                var groupName = req.body.groupName;
                var weight = req.body.weight;

                api.group.add(nameSpace, groupName, docId, weight,
                function(err, res) {
                    if (err) {
                        _res.send("false");
                    } else {
                        _res.send("true");
                    }
                })
            });

            app.post('/group/remove', site.checkAdmin,
            function(req, res) {
                var _res = res;

                var docId = req.body.docId;
                var nameSpace = req.body.nameSpace;
                var groupName = req.body.groupName;

                api.group.remove(nameSpace, groupName, docId,
                function(err, res) {
                    if (err) {
                        _res.send("false");
                    } else {
                        _res.send("true");
                    }
                })
            });

            app.get('/index-articles', site.checkAdmin,
            function(req, http_res) {
                api.search.indexUnindexedArticles();                
                http_res.redirect('/');
            });

            app.get('/add', site.checkAdmin,
            function(req, http_res) {
                /*
                api.group.list(FRONTPAGE_GROUP_NAMESPACE, function(err, groups) {
                    if(err) {
                        globalFunctions.showError(http_res, err);
                    } else {*/
                http_res.render('admin/add', {
                    //locals: {groups: groups},
                    locals: {
                        groups: []
                    },
                    layout: "layout-admin.jade"
                });
                /*}
                })*/
            });

            app.get('/manage', site.checkAdmin,
            function(req, http_res) {
                var db = config.get('COUCHDB_DATABASE');
                api.docsByDate(null,
                function(err, res) {
                    if (err) {
                        globalFunctions.showError(http_res, err);
                    } else {
                        http_res.render('admin/manage', {
                            locals: {
                                docs: res,
                                db: db
                            },
                            layout: "layout-admin.jade"
                        });
                    }
                });
            });

            app.get('/upload', site.checkAdmin,
            function(req, httpRes) {
                httpRes.render('upload', {
                    layout: "layout-admin.jade"
                });
            });

            app.post('/upload', site.checkAdmin,
            function(req, httpRes) {
                var imageData = req.body.imageData;
                var imageName = req.body.imageName;
                // create a unique name for the image to avoid s3 blob collisions
                imageName = globalFunctions.randomString(8) + "-" + imageName;
                var thumbName = 'thumb_' + imageName;
                var imageType = req.body.imageType;
                var imageID = req.body.imageID;

                // use async library to call these functions in series, passing vars between them
                async.waterfall([
                function(callback) {
                    if (!imageType in VALID_EXTENSIONS) {
                        callback("Invalid file type for " + imageName + ". Must be an image.");
                    }
                    else {
                        callback(null)
                    }
                },
                function(callback) {
                    var buf = new Buffer(imageData, 'base64');
                    fs.writeFile(imageName, buf,
                    function(err) {
                        callback(err);
                    });
                },
                function(callback) {
                    fs.readFile(imageName,
                    function(err, data) {
                        callback(err, data);
                    });
                },
                function(data, callback) {
                    //put image in AWS S3 storage
                    s3.put(data, imageName, imageType,
                    function(err, url) {
                        callback(err, url);
                    });
                },
                function(url, callback) {
                    im.convert([imageName, '-thumbnail', THUMB_DIMENSIONS, thumbName],
                    function(imErr, stdout, stderr) {
                        callback(imErr, url);
                    });
                },
                function(url, callback) {
                    fs.readFile(thumbName,
                    function(err, data) {
                        callback(err, url, data);
                    });
                },
                function(url, data, callback) {
                    s3.put(data, thumbName, imageType,
                    function(err, thumbUrl) {
                        callback(err, url, thumbUrl);
                    });
                },
                function(url, thumbUrl, callback) {
                    api.image.createOriginal(imageName, url, imageType, {
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
                //clean up files
                function(res, url, callback) {
                    _deleteFiles([imageName, thumbName],
                    function(err) {
                        callback(err, res, url);
                    });
                }
                ],
                function(err, result, url) {
                    if (err) {
                        globalFunctions.log(err);

                        if (typeof(err) == "object") {
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

            app.get('/image/:imageName', site.checkAdmin,
            function(req, httpRes) {
                var imageName = req.params.imageName;
                api.image.getOriginal(imageName,
                function(err, orig) {
                    if (err) globalFunctions.showError(httpRes, err);
                    else {
                        api.docsById(orig.value.imageVersions,
                        function(err2, versions) {
                            if (err2) globalFunctions.showError(httpRes, err2);
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
                                        versions: versions,
                                        imageTypes: IMAGE_TYPES,
                                        article: req.query.article,
                                        cropSizes: CROP_SIZES
                                    },
                                    layout: "layout-admin.jade"
                                });
                            }
                        })
                    }
                });
            });

            app.post('/image/info', site.checkAdmin,
            function(req, httpRes) {
                var data = {};
                var id = req.body.id;
                data.name = req.body.name;
                data.date = req.body.date;
                data.caption = req.body.caption;
                data.photographer = req.body.photographer;
                data.location = req.body.location;

                api.image.edit(id, data,
                function() {
                    httpRes.redirect('/admin/image/' + data.name);
                });

            });

            app.post('/image/crop', site.checkAdmin,
            function(req, httpRes) {
                var imageName = req.body.name;
                var article = req.body.article;
                var geom = _getMagickString(
                parseInt(req.body.x1),
                parseInt(req.body.y1),
                parseInt(req.body.x2),
                parseInt(req.body.y2));
                var width = req.body.finalWidth;
                var height = req.body.finalHeight;
                var croppedName = '';

                async.waterfall([
                function(callback) {
                    api.image.getOriginal(imageName, callback);
                },
                function(orig, callback) {
                    croppedName = 'crop_' + orig.value.name;
                    console.log(orig.value.url);
                    _downloadUrlToPath(orig.value.url, orig.value.name,
                    function(err) {
                        callback(err, orig);
                    });
                },
                function(orig, callback) {
                    im.convert([orig.value.name, '-crop', geom,
                    '-resize', width.toString() + 'x' + height.toString(), croppedName],
                    function(imErr, stdout, stderr) {
                        callback(imErr, orig);
                    });
                },
                function(orig, callback) {
                    fs.readFile(croppedName,
                    function(err, buf) {
                        callback(err, orig, buf);
                    });
                },
                function(orig, buf, callback) {
                    var versionNum = orig.value.imageVersions.length + 1;
                    var type = orig.value.contentType;
                    var s3Name = versionNum + orig.value.name;
                    s3.put(buf, s3Name, type,
                    function(s3Err, url) {
                        callback(s3Err, orig, url);
                    });
                },
                function(orig, url, callback) {
                    api.image.createVersion(orig.id, url, width, height,
                    function(err, res) {
                        callback(err, orig);
                    });
                },
                function(orig, callback) {
                    _deleteFiles([orig.value.name, croppedName],
                    function(err) {
                        callback(err, orig);
                    }
                    );
                }
                ],
                function(err, orig) {
                    if (err) {
                        globalFunctions.showError(httpRes, err);
                    } else {
                        if (err) globalFunctions.showError(httpRes, err);
                        else if (article) httpRes.redirect('/admin/image/' + imageName + '?article=' + article);
                        else httpRes.redirect('/admin/image/' + imageName);
                    }
                }
                );
            });

            app.post('/edit', site.checkAdmin,
            function(req, http_res) {
                if (req.body.versionId) {
                    //adding image to article
                    api.docForUrl(req.body.article,
                    function(err, doc) {
                        var images = doc.images;
                        if (!images) images = {};
                        images[req.body.imageType] = req.body.versionId;
                        console.log("jsfljwelf");
                        console.log(doc._id);
                        api.editDoc(doc._id, {
                            images: images
                        },
                        function(err2, res) {
                            if (err2) globalFunctions.showError(http_res, err2);
                            else http_res.redirect('/article/' + req.body.article + '/edit');
                        })
                    });
                } else {

                    var id = req.body.doc.id;
                    /*
                    var new_groups = req.body.doc.groups;
                    if(!(new_groups instanceof Array)) { //we will get a string if only one box is checked
                        new_groups = [new_groups];
                    }*/
                    var fields = {
                        title: req.body.doc.title,
                        body: req.body.doc.body,
                        teaser: req.body.doc.teaser
                        //author: req.body.doc.author
                        //groups: new_groups
                    };
                    _renderBody(req.body.doc.body, function(err, rendered) {
                        fields.renderedBody = rendered;
                        api.editDoc(id, fields,
                        function(err, res, url) {
                            if (err) {
                                globalFunctions.showError(http_res, err);
                            } else {
                                http_res.redirect('/article/' + url + '/edit');
                            }
                        });
                    });
                }
            });

            app.post('/add', site.checkAdmin,
            function(req, http_res) {
                var form = req.body.doc;
                var fields = {
                    body: form.body,
                    author: form.author,
                    title: form.title,
                    teaser: form.teaser
                };
                /*
                var groups = req.body.doc.groups;
                if(groups) {
                    // we will get a string if only one box is checked
                    if(!(groups instanceof Array)) {
                            groups = [groups];
                    }
                    groups.map(function(group) {
                        fullyQualifiedName = [FRONTPAGE_GROUP_NAMESPACE, group];
                        return [fullyQualifiedName, null];
                    });

                    fields.groups = groups;
                }*/

                async.waterfall([
                function(callback) {
                    _renderBody(form.body, function(err, rendered) {
                        fields.renderedBody = rendered;
                        callback(null);
                    });
                },
                function(callback) {
                    api.addDoc(fields, callback);
                },
                function(res, url, callback) {
                    var groups = req.body.doc.groups;
                    if (groups) {
                        var fcns = [];
                        if (! (groups instanceof Array)) {
                            //we will get a string if only one box is checked
                            groups = [groups];
                        }
                        groups.forEach(function(group) {
                            api.group.add(res.id, FRONTPAGE_GROUP_NAMESPACE, group,
                            function(add_err, add_res) {
                                if (add_err) {
                                    callback(add_err);
                                }
                            });
                        });
                    }
                    callback(null, url);
                }
                ],
                function(err, url) {
                    if (err) {
                        globalFunctions.showError(http_res, err);
                        console.log(err);
                    }
                    else {
                        http_res.redirect('article/' + url);
                    }
                }
                );
            });
        });

        callback(null);
    });
}
