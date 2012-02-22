var admin = exports;

var async = require('async');
var fs = require('fs');
var md = require('node-markdown').Markdown;
var solr = require('solr');
var sprintf = require('sprintf').sprintf;
var _ = require("underscore");

var api = require('../../api');
var config = require("../../config");
var db = require('../../db-abstract');
var k4export = require('./k4export');
var log = require('../../log');
var sitemap = require('../../sitemap');

admin.image = require('./image');
admin.layout = require('./layout').renderLayout;

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

admin.index = function (req, res, next) {
    res.render('admin/index');
};

admin.newsletter = function (req, res, next) {
    api.newsletter.createNewsletter(function(err, campaignID) {
        if (err) next(err);
        else {
            res.render('admin/newsletter', {
                js: ['admin/newsletter'],
                locals: {campaignID: campaignID}
            });
        }
    });
};

admin.newsletterData = function(req, res, next) {
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
                                  
            if(process.env.NODE_ENV === 'production') {
                log.notice("Building sitemaps...");
		sitemap.generateAllSitemaps(function (err) {
		    if (err) log.warning(err);
		});
            }
        });
    }
};

admin.indexArticles = function (req, res, next) {
    api.search.indexUnindexedArticles();
    res.redirect('/');
};

admin.addArticle = function (req, res, next) {
    api.taxonomy.getTaxonomyListing(function (err, taxonomy) {
        res.render('admin/add', {
            locals:{
                groups:[],
                taxonomy:taxonomy
            }
        });
    });
};

admin.addPage = function (req, res, next) {
    res.render('admin/addPage', {
        locals: {
            groups:[]
        }
    });
};

admin.manage = function (req, res, next) {
    var db = api.getDatabaseName();
    var host = api.getDatabaseHost();
    var port = api.getDatabasePort() || "80";

    var beforeKey = req.query.beforeKey;
    var beforeID = req.query.beforeID;

    api.docsByDate(beforeKey, beforeID, function (err, docs) {
        if (err) next(err);
        else res.render('admin/manage', {
            js: ['admin/manage'],
            locals:{
                docs:docs,
                hasPrevious:(beforeID != null),
                db:db,
                host:host,
                port:port
            }
        });
    });
};

admin.k4export = function (req, res, next) {
    res.render('admin/k4export', {
        locals:{
            failed:null,
            succeeded:null,
            taxonomy:null
        }
    });
};

admin.k4exportData = function (req, res, next) {
    async.parallel({
        k4: function(callback) {
            k4export.runExporter(req.files.zip.path, function (failed, success) {
	            fs.unlink(req.files.zip.path);
                callback(null, {failed: failed, success: success});
            });
        },
        images: function(callback) {
            var imageTypes = api.image.IMAGE_TYPES;

            api.image.getOriginals(50, null, null, function (err, origs) {
                origs = _.sortBy(origs, function (image) {
                    return image.displayName.toLowerCase();
                });

                
                var imageVersionIds = [];
                origs.forEach(function(image) {
                    image.imageVersions.forEach(function(versionId) {
                        imageVersionIds.push(versionId);
                    });
                });

                api.docsById(imageVersionIds, function(err, versions) {
                    var toReturn = [];
                    var i = 0;

                    origs.forEach(function(image) {
                        var temp = {    
                            originalId: image._id,
                            displayName: image.displayName,
                            thumbUrl: image.thumbUrl,
                            imageVersions: image.imageVersions,
                            imageVersionTypes: []
                        };

                        temp.imageVersions.forEach(function(imageVersion) {
                            Object.keys(imageTypes).forEach(function(type) {
                                if(imageTypes[type].width == versions[i].doc.width && imageTypes[type].height == versions[i].doc.height) {
                                    temp.imageVersionTypes.push(type);
                                }
                            });
                            i ++;
                        });
                        toReturn.push(temp);
                    });
                                
                    callback(err, toReturn);
                });
            });
        },
        taxonomy: function(callback) {
            api.taxonomy.getTaxonomyListing(function(err, taxonomy) {
                callback(err, taxonomy);
            });
        }
    },
    function(err, results) {
        res.render('admin/k4export', {
	    js: ['admin/k4export?v=5'],
            locals:{
                failed: results.k4.failed,
                succeeded: results.k4.success,
                taxonomy: results.taxonomy,
                imageData: results.images
	    }
        });
    });
};

admin.editArticleData = function (req, http_res, next) {
    if (req.body.imageVersionId) {
        api.image.addVersionsToDoc(req.body.docId, req.body.original, req.body.imageVersionId, req.body.imageType, function (err, res) {
            if (err) next(http_res);
            else if(req.body.afterUrl) http_res.redirect(req.body.afterUrl);
            else http_res.redirect('/admin');
        });
    }
    else if (req.body.doc.taxonomy == '') {
        next('No section selected for article');
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
            subhead:req.body.doc.subhead,
            teaser:req.body.doc.teaser,
            authors:req.body.doc.authors.split(", "),
            taxonomy:JSON.parse(req.body.doc.taxonomy)
            //groups: new_groups
        };
        _renderBody(req.body.doc.body, function (err, rendered) {
            fields.renderedBody = rendered;
            api.editDoc(id, fields,
                        function (err, res, url) {
                            if (err) next(err);
                            else http_res.redirect('/article/' + url);
                        });
        });
    }
};

admin.addArticleData = function (req, http_res, next) {
    if (req.body.doc.taxonomy == '') {
        next('No section selected for article');
    }
    else {
        var form = req.body.doc;

        var fields = {
            body:form.body,
            authors:form.authors.split(" ,"),
            title:form.title,
            subhead:form.subhead,
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
        ], function (err, url) {
            if (err) next(err);
            else http_res.redirect('/article/' + url);
        });
    }
};

admin.addPageData = function (req, http_res, next) {
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
    ], function (err, url) {
        if (err) next(err);
        else http_res.redirect('page/' + url);
    });
};


function insertParagraphTags(text) {
    if (text.search(/<p>/) === -1) {
        text = "<p>" + text.replace(/\r\n|\n/g, "</p><p>") + "</p>";
    }
    return text;
}
