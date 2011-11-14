var api = require('../../api');
var db = require('../../db-abstract');
var log = require('../../log');
var async = require('async');
var fs = require('fs');
var s3 = require('./s3.js');
var http = require('http');
var formidable = require('formidable');
var k4export = require('./k4export')
var solr = require('solr');
var md = require('node-markdown').Markdown;
var sprintf = require('sprintf').sprintf;
var config = require("../../config");
var site = require('../../api/lib/site.js');
var globalFunctions = require('../../global-functions');


var layoutAdmin = require('./layout.js');
var imageAdmin = require('./image.js');

var db = require('../../db-abstract')

var VIDEO_PLAYERS = {
    "youtube": "<iframe width=\"560\" height=\"345\" src=\"http://www.youtube.com/embed/%s\" frameborder=\"0\" allowfullscreen></iframe>",
    "vimeo": "<iframe src=\"http://player.vimeo.com/video/%s?title=0&amp;byline=0&amp;portrait=0\" width=\"400\" height=\"225\" frameborder=\"0\"></iframe>"
};
var REGEX_FORMAT = "(\{%s:)([^}]+)(\})";

function _renderBody(body, cbck) {
    
    async.waterfall([
    function(callback) {
        for(var name in VIDEO_PLAYERS) {
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

exports.init = function(app, callback) {
    s3.init(function(err) {
        if (err)
        {
            log.error("S3 init failed!");
            return callback(err);
        }
        
        //Run this to render bodies for all articles
        /*
        api.docsByDate(null, function(err, docs) {
            log.debug("Got docs");
            docs.forEach(function(doc, index) {
                _renderBody(doc.body, function(err, rendered) {
                    api.editDoc(doc._id, {
                        renderedBody: rendered
                    }, 
                    function(err) {
                        log.info("Updating " + index + " of " + docs.length);
                    });
                });
            });
        });
        */


        app.namespace('/admin',
        function() {
            app.get('/', site.checkAdmin, function(req, res) {
                res.render('admin/index', {
                    layout: "layout-admin.jade"
                });
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
                        log.warning(err);
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
                var rootSections = ["News", "Sports", "Opinion", "Recess", "Towerview"];

                db.taxonomy.getHierarchy(function (err, res) {
                    var taxonomy = {};
                    res.forEach(function(value) {
                        value = value.key;
                        //var current = taxonomy;

                        if (value && value.length > 0 && rootSections.indexOf(value[0]) != -1) {
                            var key = "";
                            for(var i = 0; i < value.length - 1; i++) {
                                key += "-";
                            }
                            key += " " + value[value.length - 1]

                            taxonomy[key] = JSON.stringify(value);
                            /*
                            value.forEach(function(x) {
                                if (!current[x]) {
                                    current[x] = {};
                                }
                                current = current[x];
                            })*/
                        }
                    })

                    http_res.render('admin/add', {
                        locals: {
                            groups: [],
                            taxonomy: taxonomy
                        },
                        layout: "layout-admin.jade"
                    });
                });


            });

            app.get('/addPage', site.checkAdmin,
            function(req, http_res) {
                http_res.render('admin/addPage', {
                    //locals: {groups: groups},
                    locals: {
                        groups: []
                    },
                    layout: "layout-admin.jade"
                });
            });

            app.get('/manage', site.checkAdmin,
            function(req, http_res) {
                var db = api.getDatabaseName();
                var host = api.getDatabaseHost();
                var port = api.getDatabasePort() || "80";
                api.docsByDate(null,
                function(err, res) {
                    if (err) {
                        globalFunctions.showError(http_res, err);
                    } else {
                        http_res.render('admin/manage', {
                            locals: {
                                docs: res,
                                db: db,
                                host: host,
                                port: port
                            },
                            layout: "layout-admin.jade"
                        });
                    }
                });
            });

	    app.get('/k4export', site.checkAdmin,
            function(req, http_res) {
                http_res.render('admin/k4export', {
                    locals: {
			groups: [],
			failed: null,
			succeeded: null,
			taxonomy: null
                    },
                    layout: "layout-admin.jade"
                });
	    });

	    app.post('/k4export', site.checkAdmin,
            function(req, http_res) {
		try { fs.mkdirSync("./tmp", "0755") }
		catch (err) {} // directory already exists

		var form = new formidable.IncomingForm();
		form.uploadDir = './tmp';
		form.parse(req, function(err, fields, files) {
		    if (err)
			http_res.end(err);
		    else {
			db.taxonomy.getTaxonomyListing(function (err, taxonomy) {
			    k4export.runExporter(files.zip.path,
                                function(failed, success) {
				    http_res.render('admin/k4export', {
					locals: {
					    groups: [],
					    failed: failed,
					    succeeded: success,
					    taxonomy: taxonomy
					},
					layout: "layout-admin.jade"
				    });
				});
			});
		    }
		});
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
                        teaser: req.body.doc.teaser,
                        authors: req.body.doc.authors.split(", "),
                        taxonomy: req.body.doc.taxonomy.split(",")
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
                    authors: form.authors.split(" ,"),
                    title: form.title,
                    teaser: form.teaser,
                    type: form.type,
                    taxonomy: JSON.parse(form.taxonomy)
                };

                async.waterfall([
                    function(callback) {
                        _renderBody(form.body, function(err, rendered) {
                            fields.renderedBody = rendered;
                            callback(null);
                        });
                    },
                    function(callback) {
                        api.addDoc(fields, callback);
                    }
                ],
                function(err, url) {
                    if (err) {
                        globalFunctions.showError(http_res, err);
                    }
                    else {

                        http_res.redirect('/article/' + url);
                    }
                }
                );
            });


            app.post('/addPage', site.checkAdmin,
            function(req, http_res) {
                var form = req.body.doc;
                var fields = {
                    body: form.body,
                    title: form.title
                };

                async.waterfall([
                function(callback) {
                    _renderBody(form.body, function(err, rendered) {
                        fields.renderedBody = rendered;
                        callback(null);
                    });
                },
                function(callback) {
                    api.addDoc(fields, callback);
                }
                ],
                function(err, url) {
                    if (err) {
                        globalFunctions.showError(http_res, err);
                        log.warning(err);
                    }
                    else {
                        http_res.redirect('page/' + url);
                    }
                }
                );
            });

            app.delete('/article/:docId', site.checkAdmin, function(req, http_res) {
                db.remove(req.params.docId, req.body.rev, function() {
                    api.search.unindexArticle(req.params.docId, function(err,resp){ });
                    http_res.send({status:true});
                });

            });

        });

        app.namespace('/admin/layout', layoutAdmin.bindPath(app));
        app.namespace('/admin/image', imageAdmin.bindPath(app));

        callback(null);
    });
}
