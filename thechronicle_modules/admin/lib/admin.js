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


admin.sendNewsletter = function (testEmail, campaignID, callback) {
    if (testEmail) {
        api.newsletter.sendTestNewsletter(campaignID, testEmail, callback);
    }
    else {
        api.newsletter.sendNewsletter(campaignID, function (err) {
            callback(err);
            if (process.env.NODE_ENV === 'production') {
                log.notice("Building sitemaps...");
                sitemap.generateAllSitemaps(function (err) {
                    if (err) log.warning(err);
                });
            }
        });
    }
}

admin.author = function (req, res, next) {
    var name = req.query.name;
    if (!name) {
        res.render('admin/author', {
            js:['admin/author']
        });
    } else {
        api.authors.getInfo(name, function (err, docs) {
            res.render('admin/author', {
                js    :['admin/author'],
                locals:{
                    doc:docs[0]
                }
            });
        });
    }
};

admin.addArticle = function (req, res, next) {
    api.taxonomy.getTaxonomyListing(function (err, taxonomy) {
        res.render('admin/add', {
            locals:{
                groups  :[],
                taxonomy:taxonomy
            }
        });
    });
};

admin.addPage = function (req, res, next) {
    res.render('admin/addPage', {
        locals:{
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
            js    :['admin/manage?v=2'],
            locals:{
                docs       :docs,
                hasPrevious:(req.query.beforeID != null),
                db         :db,
                host       :host,
                port       :port
            }
        });
    });
};

admin.saveAuthorInfo = function (doc, callback) {
    api.authors.editInfo(doc, callback);
};

admin.addArticle = function (doc, callback) {
    if (doc.taxonomy == '') {
        callback('No section selected for article');
    }
    else {
        var fields = {
            body:doc.body,
            authors:doc.authors.split(", "),
            title:doc.title,
            subhead:doc.subhead,
            teaser:doc.teaser,
            type:doc.type,
            taxonomy:JSON.parse(doc.taxonomy)
        };

        api.addDoc(fields, callback);
    }
};



admin.k4export = function (filepath, callback) {
    async.parallel({
        k4      :function (callback) {
            k4export.runExporter(filepath, function (failed, success) {
                fs.unlink(filepath);
                callback(null, {failed:failed, success:success});
            });
        },
        images  :function (callback) {
            var imageTypes = api.image.IMAGE_TYPES;

            api.image.getOriginals(50, null, null, function (err, origs) {
                origs = _.sortBy(origs, function (image) {
                    return image.displayName.toLowerCase();
                });


                var imageVersionIds = [];
                origs.forEach(function (image) {
                    image.imageVersions.forEach(function (versionId) {
                        imageVersionIds.push(versionId);
                    });
                });

                api.docsById(imageVersionIds, function (err, versions) {
                    var toReturn = [];
                    var i = 0;

                    origs.forEach(function (image) {
                        var temp = {
                            originalId       :image._id,
                            displayName      :image.displayName,
                            thumbUrl         :image.thumbUrl,
                            imageVersions    :image.imageVersions,
                            imageVersionTypes:[]
                        };

                        temp.imageVersions.forEach(function (imageVersion) {
                            Object.keys(imageTypes).forEach(function (type) {
                                if (imageTypes[type].width == versions[i].doc.width && imageTypes[type].height == versions[i].doc.height) {
                                    temp.imageVersionTypes.push(type);
                                }
                            });
                            i++;
                        });
                        toReturn.push(temp);
                    });

                    callback(err, toReturn);
                });
            });
        },
        taxonomy:function (callback) {
            api.taxonomy.getTaxonomyListing(function (err, taxonomy) {
                callback(err, taxonomy);
            });
        }
    }, callback);
};

admin.addArticle = function (doc, callback) {
    if (doc.taxonomy == '') {
        callback('No section selected for article');
    }
    else {
        var fields = {
            body    :doc.body,
            authors :doc.authors.split(", "),
            title   :doc.title,
            subhead :doc.subhead,
            teaser  :doc.teaser,
            type    :doc.type,
            taxonomy:JSON.parse(doc.taxonomy)
        };

        api.addDoc(fields, callback);
    }
};

admin.editArticle = function (doc, callback) {
    if (doc.taxonomy == '') {
        callback('No section selected for article');
    }
    else {
        var id = doc.id;

        var fields = {
            title   :doc.title,
            body    :doc.body,
            subhead :doc.subhead,
            teaser  :doc.teaser,
            authors :doc.authors.split(", "),
            taxonomy:JSON.parse(doc.taxonomy)
        };

        api.editDoc(id, fields, callback);
    }
};

admin.layout = function (section, group, layoutConfig, callback) {
    async.parallel({
        sectionDocs:function (cb) {
            if (section)
                api.taxonomy.docs([section], 30, null, function (err, docs) {
                    cb(err, docs); // need to ignore last callback argument
                });
            else
                api.docsByDate(30, null, cb);
        },
        groupDocs  :function (cb) {
            api.group.docs(layoutConfig[group].namespace, null, cb);
        }
    }, function (err, results) {
        if (err) callback(err);
        else {
            // sort section documents alphabetically
            results.sectionDocs = _.sortBy(results.sectionDocs, function (doc) {
                return doc.title;
            });
            callback(null, results);
        }
    });
};
