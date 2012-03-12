var db = require('./db-abstract');
var image = exports;
var async = require('async');

var RESULTS_PER_PAGE = 25;

image.listOriginalsByDate = function (limit, beforeKey, beforeID, callback) {
    if(!limit || limit < 0) {
        limit = RESULTS_PER_PAGE;
    }

    var query = {
        descending:true,
        limit: limit
    };

    if(beforeKey) query.startkey = parseInt(beforeKey);
    if(beforeID) query.startkey_docid = beforeID;

    db.view('articles/image_originals', query, callback);
};

image.originalsIndex = function (options, callback) {
    db.view('articles/image_originals_index', options, callback);
};

image.createOriginal = function (name, options, callback) {
    image.originalsIndex({
        key:name
    }, function (err, res) {
        if (err) callback(err, null);
        else {
            if (res.length != 0) callback("Name already in use", null);
            else {
                options.type = 'image';
                options.name = name;
                options.imageVersions = [];
                options.uploadDate = new Date().getTime();
                db.save(options, callback);
            }
        }
    });
};

image.createVersion = function (parentId, options, callback) {
    options.type = 'imageVersion';
    options.original = parentId;
    db.save(options, function (err, saveRes) {
        if (err) callback(err, null);
        else {
            var versionId = saveRes.id;
            db.get(parentId, function (err2, doc) {
                if (err2) callback(err2, null);
                else {
                    var versions = doc.imageVersions;
                    versions.push(versionId);
                    db.merge(parentId, {
                                imageVersions:versions
                            },
                            function(err3, res) {
                                if(res) {
                                    res['_versionAdded'] = versionId;
                                }
                                callback(err3,res);
                            });
                }
            });
        }
    });
};

image.deleteVersion = function (versionId, updateOriginal, topCallback) {
    async.waterfall([
        function (callback) {
            db.get(versionId, callback);
        },
        function (version, callback) {
            if(updateOriginal) {
                db.get(version.original, function(err, orig) {
                    callback(err, orig, version);
                });
            } else {
                callback(null, null, version);
            }
        },
        function (orig, version, callback) {
            if(updateOriginal) {
                var versions = orig.imageVersions;
                var i = versions.indexOf(versionId);
                if(i != -1) {
                    versions.splice(i, 1);
                    orig.imageVersions = versions;
                    console.log('updating original');
                    db.save(orig, function(err, res) {
                        callback(err, version);
                    });
                } else {
                    callback(null, version);
                }
            } else {
                callback(null, version);
            }  
        },
        function (version, callback) {
            console.log('removing version');
            db.remove(versionId, version._rev, function(err, res) {
                callback(err, version);
            });
        }
    ],
    topCallback);
};

image.edit = function (imageID, data, callback) {
    db.merge(imageID, data, callback);
};

image.originalsForPhotographer = function (photog, callback) {
    db.view('articles/photographers', {
        key:photog
    }, callback);
};

image.docsForVersion = function(versionId, callback) {
    db.view('articles/doc_images', {
        key: versionId
    }, callback);
};
