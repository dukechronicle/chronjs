var async = require('async');
var fs = require('fs');
var http = require('http');
var md = require('node-markdown').Markdown;
var solr = require('solr');
var sprintf = require('sprintf').sprintf;

var api = require('../../api');
var config = require("../../config");
var db = require('../../db-abstract');
var globalFunctions = require('../../global-functions');
var k4export = require('./k4export');
var log = require('../../log');
var site = require('../../api/lib/site');
var s3 = require('../../api/lib/s3');
var sitemap = require('../../sitemap');


var layoutAdmin = require('./layout');
var imageAdmin = require('./image');
var databaseAdmin = require('./database');

var VIDEO_PLAYERS = {
    "youtube": "<iframe width=\"560\" height=\"345\" src=\"http://www.youtube.com/embed/%s\" frameborder=\"0\" allowfullscreen></iframe>",
    "vimeo": "<iframe src=\"http://player.vimeo.com/video/%s?title=0&amp;byline=0&amp;portrait=0\" width=\"400\" height=\"225\" frameborder=\"0\"></iframe>"
};
var REGEX_FORMAT = "(\{%s:)([^}]+)(\})";

function _renderBody(body, callback) {

    for(var name in VIDEO_PLAYERS) {
        var pattern = new RegExp(sprintf(REGEX_FORMAT, name), 'g');
        body = body.replace(pattern, function(match) {
            return sprintf(VIDEO_PLAYERS[name], RegExp.$2);
        });
    }

    callback(null, md(body));

}

exports.init = function (app, callback) {
    s3.init(function (err) {
        if (err) {
            log.error("S3 init failed!");
            return callback(err);
        }

        //Run this to render bodies for all articles
        /*
         api.docsByDate(null, null, function(err, docs) {
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
                function () {
                    app.get('/', site.checkAdmin, function (req, res) {
                        res.render('admin/index', {
                            layout:"layout-admin.jade"
                        });
                    });

                    app.get('/newsletter', site.checkAdmin, function (req, res) {
                       api.newsletter.createNewsletter(function(campaignID) {
                            res.render('admin/newsletter', {
                                layout: "layout-admin.jade",
                                locals: {campaignID: campaignID}
                            });
                        });
                    });

                    app.post('/newsletter', site.checkAdmin, function(req,res) {
                        var testEmailToSendTo = req.body.testEmail;
                        var campaignID = req.body.campaignID;

                        if(testEmailToSendTo != null) {
                            api.newsletter.sendTestNewsletter(campaignID, testEmailToSendTo, function(err) {
                                res.send("sent");
                            });
                        }
                        else {
                            api.newsletter.sendNewsletter(campaignID, function(err) {
                                res.send("sent");
		                log.notice("Building sitemaps...");
		                sitemap.generateAllSitemaps(function (err) {
			            if (err) log.warning(err);
		                });
                            });
                        }
                    });

                    app.post('/group/add', site.checkAdmin,
                            function (req, res) {
                                var _res = res;

                                var docId = req.body.docId;
                                var nameSpace = req.body.nameSpace;
                                var groupName = req.body.groupName;
                                var weight = req.body.weight;

                                api.group.add(nameSpace, groupName, docId, weight,
                                        function (err, res) {
                                            if (err) {
                                                log.warning(err);
                                                _res.send("false");
                                            } else {
                                                _res.send("true");
                                            }
                                        })
                            });

                    app.post('/group/remove', site.checkAdmin,
                            function (req, res) {
                                var _res = res;

                                var docId = req.body.docId;
                                var nameSpace = req.body.nameSpace;
                                var groupName = req.body.groupName;

                                api.group.remove(nameSpace, groupName, docId,
                                        function (err, res) {
                                            if (err) {
                                                _res.send("false");
                                            } else {
                                                _res.send("true");
                                            }
                                        })
                            });

                    app.get('/index-articles', site.checkAdmin,
                            function (req, http_res) {
                                api.search.indexUnindexedArticles();
                                http_res.redirect('/');
                            });

                    app.get('/add', site.checkAdmin,
                            function (req, http_res) {
                                api.taxonomy.getTaxonomyListing(function (err, taxonomy) {
                                    http_res.render('admin/add', {
                                        locals:{
                                            groups:[],
                                            taxonomy:taxonomy
                                        },
                                        layout:"layout-admin.jade"
                                    });
                                });
                            });

                    app.get('/addPage', site.checkAdmin,
                            function (req, http_res) {
                                http_res.render('admin/addPage', {
                                    //locals: {groups: groups},
                                    locals:{
                                        groups:[]
                                    },
                                    layout:"layout-admin.jade"
                                });
                            });

                    app.get('/manage', site.checkAdmin,
                            function (req, http_res) {
                                var db = api.getDatabaseName();
                                var host = api.getDatabaseHost();
                                var port = api.getDatabasePort() || "80";

                                var beforeKey = req.query.beforeKey;
                                var beforeID = req.query.beforeID;

                                api.docsByDate(beforeKey, beforeID,
                                        function (err, res) {
                                            if (err) {
                                                log.error(err);
                                                globalFunctions.showError(http_res, err);
                                            } else {
                                                http_res.render('admin/manage', {
                                                    locals:{
                                                        docs:res,
                                                        hasPrevious:(beforeID != null),
                                                        db:db,
                                                        host:host,
                                                        port:port
                                                    },
                                                    layout:"layout-admin.jade"
                                                });
                                            }
                                        });
                            });

                    app.get('/k4export', site.checkAdmin,
                            function (req, res) {
                                res.render('admin/k4export', {
                                    locals:{
                                        groups:[],
                                        failed:null,
                                        succeeded:null,
                                        taxonomy:null
                                    },
                                    layout:"layout-admin.jade"
                                });
                            });

                    app.post('/k4export', site.checkAdmin,
                             function (req, res) {
                                 api.taxonomy.getTaxonomyListing(function (err, taxonomy) {
                                     k4export.runExporter(req.files.zip.path, function (failed, success) {
					 fs.unlink(req.files.zip.path);
                                         res.render('admin/k4export', {
					     locals:{
                                                 groups:[],
                                                 failed:failed,
                                                 succeeded:success,
                                                 taxonomy:taxonomy
					     },
					     layout:"layout-admin.jade"
                                         });
				     });
                                 });
                             });

                    app.post('/edit', site.checkAdmin,
                            function (req, http_res) {
                                if (req.body.imageVersionId) {
                                   api.image.addVersionToDoc(req.body.docId, req.body.original, req.body.imageVersionId, req.body.imageType, function (err, res) {
                                        if (err) globalFunctions.showError(http_res, err);
                                        else if(req.body.afterUrl) http_res.redirect(req.body.afterUrl);
                                        else http_res.redirect('/admin');
                                   });
                                } 
                                else {
                                    var id = req.body.doc.id;
                                    /*
                                     var new_groups = req.body.doc.groups;
                                     if(!(new_groups instanceof Array)) { //we will get a string if only one box is checked
                                     new_groups = [new_groups];
                                     }*/
                                    var fields = {
                                        title:req.body.doc.title,
                                        body:req.body.doc.body,
                                        teaser:req.body.doc.teaser,
                                        authors:req.body.doc.authors.split(", "),
                                        taxonomy:JSON.parse(req.body.doc.taxonomy)
                                        //groups: new_groups
                                    };
                                    _renderBody(req.body.doc.body, function (err, rendered) {
                                        fields.renderedBody = rendered;
                                        api.editDoc(id, fields,
                                                function (err, res, url) {
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
                            function (req, http_res) {
                                var form = req.body.doc;

                                var fields = {
                                    body:form.body,
                                    authors:form.authors.split(" ,"),
                                    title:form.title,
                                    teaser:form.teaser,
                                    type:form.type,
                                    taxonomy:JSON.parse(form.taxonomy)
                                };

                                async.waterfall([
                                    function (callback) {
                                        _renderBody(form.body, function (err, rendered) {
                                            fields.renderedBody = rendered;
                                            callback(null);
                                        });
                                    },
                                    function (callback) {
                                        api.addDoc(fields, callback);
                                    }
                                ],
                                        function (err, url) {
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
                            function (req, http_res) {
                                var form = req.body.doc;
                                var fields = {
                                    body:form.body,
                                    title:form.title
                                };

                                async.waterfall([
                                    function (callback) {
                                        _renderBody(form.body, function (err, rendered) {
                                            fields.renderedBody = rendered;
                                            callback(null);
                                        });
                                    },
                                    function (callback) {
                                        api.addDoc(fields, callback);
                                    }
                                ],
                                        function (err, url) {
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

                    app.delete('/article/:docId', site.checkAdmin, function (req, http_res) {
                        api.deleteDoc(req.params.docId, req.body.rev, function () {
                            http_res.send({status:true});
                        });
                    });

                });

        app.namespace('/admin/layout', layoutAdmin.bindPath(app));
        app.namespace('/admin/image', imageAdmin.bindPath(app));
        app.namespace('/admin/database', databaseAdmin.bindPath(app));

        callback(null);
    });
};
