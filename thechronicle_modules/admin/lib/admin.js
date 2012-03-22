var admin = exports;

var async = require('async');
var fs = require('fs');
var solr = require('solr');
var _ = require("underscore");

var api = require('../../api');
var config = require("../../config");
var db = require('../../db-abstract');
var k4export = require('./k4export');
var log = require('../../log');
var sitemap = require('../../sitemap');

admin.image = require('./image');
admin.layout = require('./layout').renderLayout;


admin.index = function (req, res, next) {
    res.render('admin/index');
};

admin.newsletter = function (req, res, next) {
    api.newsletter.createNewsletter(function(err, campaignID) {
        if (err) next(err);
        else {
            res.render('admin/newsletter', {
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

    var query = {};
    if (req.query.beforeKey) query.startkey = parseInt(req.query.beforeKey);
    if (req.query.beforeID) query.start_docid = req.query.beforeID;

    api.docsByDate(null, query, function (err, docs) {
        if (err) next(err);
        else res.render('admin/manage', {
            locals:{
                docs:docs,
                hasPrevious:(req.query.beforeID != null),
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
	        css: ['css/msdropdown'],
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

        var fields = {
            title:req.body.doc.title,
            body:req.body.doc.body,
            subhead:req.body.doc.subhead,
            teaser:req.body.doc.teaser,
            authors:req.body.doc.authors.split(", "),
            taxonomy:JSON.parse(req.body.doc.taxonomy)
        };

        api.editDoc(id, fields, function (err, url) {
            if (err) next(err);
            else http_res.redirect('/article/' + url);
        });
    }
};

admin.addArticleData = function (req, res, next) {
    if (req.body.doc.taxonomy == '') {
        next('No section selected for article');
    }
    else {
        var form = req.body.doc;

        var fields = {
            body:form.body,
            authors:form.authors.split(", "),
            title:form.title,
            subhead:form.subhead,
            teaser:form.teaser,
            type:form.type,
            taxonomy:JSON.parse(form.taxonomy)
        };

        api.addDoc(fields, function (err, url) {
            if (err) next(err);
            else res.redirect('/article/' + url);
        });
    }
};

admin.addPageData = function (req, res, next) {
    var form = req.body.doc;
    var fields = {
        node_title: form.title,
        body: form.body,
        style: form.style
    };

    api.page.add(fields, function (err, url) {
        if (err) next(err);
        else res.redirect('/page/' + url);
    });
};

admin.editPageData = function (req, res, next) {
    var form = req.body.doc;
    var id = form.id;

    var fields = {
        node_title: form.title,
        body: form.body,
        style: form.style
    };

    api.page.edit(id, fields, function (err, url) {
        if (err) next(err);
        else res.redirect('/page/' + url);
    });
};
