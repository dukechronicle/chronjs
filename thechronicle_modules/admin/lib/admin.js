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

admin.image = require('./image');


admin.sendNewsletter = function (testEmail, campaignID, callback) {
    if (testEmail) {
        api.newsletter.sendTestNewsletter(campaignID, testEmail, callback);
    }
    else {
        api.newsletter.sendNewsletter(campaignID, callback);
    }
}

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
        }
    }, callback);
};

admin.addArticle = function (doc, callback) {
    if (doc.taxonomy == '') {
        callback('No section selected for article');
    }
    else {
        var article = {
            body    :doc.body,
            authors :doc.authors.split(", "),
            title   :doc.title,
            subhead :doc.subhead,
            teaser  :doc.teaser,
            type    :doc.type,
            taxonomy:doc.taxonomy,
        };

        api.article.add(article, callback);
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
            taxonomy:doc.taxonomy,
        };

        api.article.edit(id, fields, callback);
    }
};

admin.addPoll = function (doc, callback) {
    if (doc.taxonomy == '') {
        callback('No section selected for poll');
    }
    else {
        var fields = {
            title:doc.title,
            taxonomy:doc.taxonomy,
            answers: doc.answers
        };

        api.poll.add(fields, callback);
    }
};

admin.editPoll = function (id, doc, callback) {
	if (doc.taxonomy == '') {
        callback('No section selected for poll');
    }
    else {
        var answers = {};
        for (var i = 0; i < doc.answers.length; i++) {
            if (doc.answers[i]) {
                answers[doc.answers[i]] = !doc.reset && i < doc.count.length ?
                    doc.count[i] : 0;
            }
        }

        var fields = {
            title:doc.title,
            taxonomy:doc.taxonomy,
            answers: answers
        };

        api.poll.edit(id, fields, callback);
    }
}

admin.layout = function (section, group, layoutConfig, callback) {
    async.parallel({
        sectionDocs: function (cb) {
            var taxonomy = section ? [ section ] : [];
            api.article.getByTaxonomy(taxonomy, 30, null, function (err, docs) {
                cb(err, docs); // need to ignore last callback argument
            });
        },
        groupDocs: function (cb) {
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
