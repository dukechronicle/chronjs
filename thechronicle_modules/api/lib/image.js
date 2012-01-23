var db = require('../../db-abstract');
var api = require('./api');
var async = require('async');
var fs = require('fs');
var im = require('imagemagick');
var _ = require("underscore");
var s3 = require('./s3.js');
var urllib = require('url');
var globalFunctions = require('../../global-functions');

var image = exports;

var THUMB_DIMENSIONS = '100x100';

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

image.addVersionToDoc = function(docId, originalImageId, versionImageId, imageType, callback) {
    api.docsById(docId,
    function (err, doc) {
        var images = doc.images;
        if (!images) images = {};
        images[imageType] = versionImageId;
        images["Original"] = originalImageId;

        api.editDoc(doc._id, {
            images:images
        }, callback);
    });
};

image.getOriginal = function (name, callback) {
    db.image.originalsIndex({
        key:name
    }, function (err, res) {
        if (err) callback(err, null);
        else {
            if (res.length != 1) callback('Original not found', null);
            else callback(null, res[0]);
        }
    });
};

image.createOriginal = function (name, url, contentType, thumbUrl, photographer, caption, location, callback) {
    var metadata = {
        url:url,
        contentType:contentType,
        thumbUrl:thumbUrl,
        photographer:photographer,
        caption:caption,
        location:location,
        date:new Date().getTime()
    };
    db.image.createOriginal(name, metadata, callback);
};

image.edit = function (imageID, data, callback) {
    db.image.edit(imageID, data, callback);
};

image.createVersion = function (parentId, url, width, height, callback) {
    var options = {
        url:url,
        width:width,
        height:height
    };
    db.image.createVersion(parentId, options, callback);
};

// should call with updateOriginal=true unless we are deleting a version in preparation for deleting an original.
image.deleteVersion = function (versionId, updateOriginal, topCallback) {
    async.waterfall([
        function (callback) {
            image.docsForVersion(versionId, callback);
        },
        function (articles, callback) {
            async.map(articles, function(article, cbck) {
                var versions = article.images;
                for (var i in versions) {
                    if(versions[i] == versionId)
                        delete versions[i];
                }
                article.images = versions;
                db.merge(article, function(err, res) {
                    cbck(err, article);
                });
                cbck(null, article);
            }, function(err, res) {
                callback(err);
            });
        },
        function (callback) {
            db.image.deleteVersion(versionId, updateOriginal, callback);
        },
        function (version, callback) {
            var url = urllib.parse(version.url);
            console.log('deleting version from s3');
            s3.delete(url.path, callback);
        }
    ],
    topCallback);
    
};

image.deleteOriginal = function (originalId, topCallback) {
    async.waterfall([
        function (callback) {
            db.get(originalId, callback);
        },
        function (orig, callback) {
            var versions = orig.imageVersions;
            async.map(versions, function(version, cbck) {
                image.deleteVersion(version, false, function(err, res) {
                    cbck(err, version);
                });
            },
            function(err, versions) {
                callback(err, orig);
            });
        },
        function (orig, callback) {
            console.log('deleting original from db');
            db.remove(originalId, orig._rev, function (err, res) {
                callback(err, orig);
            });
        },
        function (orig, callback) {
            var url = urllib.parse(orig.url);
            console.log('deleting original from s3');
            s3.delete(url.path, callback);
        }
    ], topCallback);
};

image.docsForOriginal = function (origId, topCallback) {
    async.waterfall([
        function (callback) {
            db.get(origId, callback);
        },
        function (orig, callback) {
            var versions = orig.imageVersions;
            async.reduce(versions, {}, function(obj, version, cbck) {
                image.docsForVersion(version, function(err, articles) {
                    if(err) cbck(err);
                    else {
                        for (var i in articles) {
                            if(articles[i]._id && !obj[articles[i]._id]) {
                                obj[articles[i]._id] = articles[i];
                            }
                        }
                        cbck(null, obj);
                    }
                })
            }, callback);
        },
        function (articles, callback) {
            callback(null, globalFunctions.convertObjectToArray(articles));
        }
    ], topCallback);
};

image.docsForVersion = function (versionId, topCallback) {
    async.waterfall([
        function (callback) {
            db.image.docsForVersion(versionId, callback);
        },
        function (docs, callback) {
            var newDocs = [];
            for (var i in Object.keys(docs)) {
                if(typeof docs[i] != 'function' && typeof docs[i] != 'undefined') {
                    newDocs.push(docs[i].value);
                }
            }
            callback(null, newDocs);
        }],
        topCallback);
};

image.originalsForPhotographer = function (photog, callback) {
    db.image.originalsForPhotographer(photog, callback);
};

image.getAllOriginals = function (beforeKey, beforeID, callback) {
    db.image.listOriginalsByDate(beforeKey, beforeID, function (err, res) {
        res = res.map(function (doc) {
            doc.displayName = doc.name;
            var nameSplit = doc.name.split("-", 2);
            if (nameSplit.length > 1) doc.displayName = nameSplit[1];
            return doc;
        });

        callback(err, res);
    });
};

// Complete image workflow from file to DB
image.createOriginalFromFile = function (imageName, imageType, deleteLocal, topCallback) {
    // create a unique name for the image to avoid s3 blob collisions
    var fileName = imageName;
    var thumbName = 'thumb_' + imageName;
    
    functions = [
        function (callback) {
            fs.readFile(fileName, callback);
        },
        function (data, callback) {
            //put image in AWS S3 storage
            s3.put(data, imageName, imageType, callback);
        },
        function (url, callback) {
            im.convert([fileName, '-thumbnail', THUMB_DIMENSIONS, thumbName],
                function (imErr, stdout, stderr) {
                    callback(imErr, url);
                });
        },
        function (url, callback) {
            fs.readFile(thumbName,
                function (err, data) {
                    callback(err, url, data);
                });
        },
        function (url, data, callback) {
            s3.put(data, thumbName, imageType,
                function (err, thumbUrl) {
                    callback(err, url, thumbUrl);
                });
        },
        function (url, thumbUrl, callback) {
            image.createOriginal(imageName, url, imageType, thumbUrl, null, null, null,
                function (err, res) {
                    callback(err, res, url);
                });
        }
    ];
    
    if(deleteLocal) {
        functions.push(function (res, url, callback) {
            _deleteFiles([imageName, thumbName],
                function (err) {
                    callback(err, res, url);
                });
        });
    }
    
    async.waterfall(functions, topCallback);
}
