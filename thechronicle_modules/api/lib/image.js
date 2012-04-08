var async = require('async');
var fs = require('fs');
var im = require('imagemagick');
var urllib = require('url');
var _ = require('underscore');

var api = require('./api');
var config = require('../../config');
var db = require('../../db-abstract');
var util = require('../../util');
var log = require('../../log');

var image = exports;

var IMAGE_BUCKET;
var THUMB_DIMENSIONS = '100x100';

image.init = function () {
    IMAGE_BUCKET = config.get("S3_BUCKET");
};

image.IMAGE_TYPES = {
    LargeRect: {
        width: 636,
        height: 393,
        description: "Used as the image on the article page, as well as for slideshows and featured article positions on the layouts. All article images should have it."
    },
    ThumbRect: {
        width: 186,
        height: 133,
        description: "Used as the thumbnail for articles on all layout pages, and in the newsletter. Any image for an article that will be on the layout should have it."
    },
    ThumbRectL: {
        width: 276,
        height: 165,
        description: "Used for the first article in each of the following layout groups: the Frontpage layout page for the Recess and Towerview groups, the Towerview layout page for the Savvy and Wisdom groups, and the Recess layout page for the Music, Film, and Art groups."
    },
    ThumbSquareM: {
        width: 200, // 183
        height: 200, // 183
        description: "Used for articles on the towerview layout that are in the featured group in position 2 or 3, and for articles in the sports layout in the stories group. Also used as the picture facebook shows when people like or share articles."
    },
    ThumbWide: {
        width: 300,
        height: 120,
        description: "Used for articles on the towerview layout that are in the prefix group."
    }
};

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

function _getMagickString(x1, y1, x2, y2) {
    var w = x2 - x1;
    var h = y2 - y1;
    return w.toString() + 'x' + h.toString() + '+' + x1.toString() + '+' + y1.toString();
}

image.addVersionsToDoc = function(docId, originalImageId, versionImageIds, imageTypes, callback) {
    // make singular arguments into an array if needed    
    if(!Array.isArray(versionImageIds)) versionImageIds = [versionImageIds];
    if(!Array.isArray(imageTypes)) imageTypes = [imageTypes];
    
    api.docsById(docId,
    function (err, doc) {
        if(err) return callback(err);

        var images = doc.images || {};

        for(var i = 0; i < versionImageIds.length; i ++) {        
            images[imageTypes[i]] = versionImageIds[i];
        }
        images["Original"] = originalImageId;

        db.merge(doc._id, { images:images }, callback);
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

image.createCroppedVersion = function(imageName, width, height, x1, y1, x2, y2, cb) {
    var croppedName = '';
    var geom = _getMagickString(parseInt(x1),parseInt(y1),parseInt(x2),parseInt(y2));
    
    async.waterfall(
    [
        function (callback) {
            image.getOriginal(imageName, callback);
        },
        function (orig, callback) {
            croppedName = 'crop_' + orig.value.name;
            log.info(orig.value.url);
            util.downloadUrlToPath(orig.value.url, orig.value.name, function (err) {
                callback(err, orig);
            });
        },
        function (orig, callback) {
             //crop image with given specifications
            im.convert([orig.value.name, '-crop', geom,'-resize', width.toString() + 'x' + height.toString(), croppedName], function (imErr, stdout, stderr) {
                callback(imErr, orig);
            });
        },
        function (orig, callback) {
            fs.readFile(croppedName, function (err, buf) {
                callback(err, orig, buf);
            });
        },
        function (orig, buf, callback) {
            var type = orig.value.contentType;
            var s3Name = width + "x" + height + "-" + x1 + "-" + y1 + "-" + orig.value.name;
            api.s3.put(IMAGE_BUCKET, buf, s3Name, type, null, function (s3Err, url) {
                callback(s3Err, orig, url);
            });
        },
        function (orig, url, callback) {
            var options = {
                url:url,
                width:width,
                height:height
            };

            db.image.createVersion(orig.id, options, function (err, res) {
                callback(err, orig, res);
            });            
        },
        function (orig, res, callback) {
            _deleteFiles([orig.value.name, croppedName], function (err) {
                callback(err, res);
            });
        }
    ],
    cb);
};

// you can specify either the documentID, or the document object itself
image.removeVersionFromDocument = function(documentID, document, versionId, callback) {
    var afterFunc = function(doc, cbck) {
        var versions = doc.images;
        for (var i in versions) {
            if(versions[i] == versionId) delete versions[i];
        }
        doc.images = versions;
        db.merge(doc, function(err, res) {
            cbck(err, doc);
        });
    };

    if(document == null) {
        api.docsById(documentID, function (err, doc) {
            if(err) return callback(err);
            else afterFunc(doc, callback);
        });
    }
    else {
        afterFunc(document, callback);
    }
};

// should call with updateOriginal=true unless we are deleting a version in preparation for deleting an original.
image.deleteVersion = function (versionId, updateOriginal, topCallback) {
    var isVersion = false;
    
    async.waterfall([
        function (callback) {
            db.get(versionId, callback);
        },
        function (imageDoc, callback) {
            isVersion = (imageDoc.type == "imageVersion");
            image.docsForVersion(versionId, callback);
        },
        function (documents, callback) {
            async.map(documents, function(document, cbck) {
                image.removeVersionFromDocument(null, document, versionId, cbck);
            }, function(err, res) {
                callback(err);
            });
        },
        function (callback) {
            // only delete this 'version' from the db if it is an imageVersion and not an image attached as an original         
            if(isVersion) db.image.deleteVersion(versionId, updateOriginal, callback);
            else callback(null, {});
        },
        function (version, callback) {
            // only delete this 'version' from s3 if it is an imageVersion and not an image attached as an original        
            if(isVersion) {               
                var url = urllib.parse(version.url);           
                log.info('deleting version from s3 ' + url.pathname);
                api.s3.del(IMAGE_BUCKET, url.pathname, callback);
            }
            else callback();
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
            async.mapSeries(versions, function(version, cbck) {
                image.deleteVersion(version, false, function(err, res) {
                    if(err) log.info(err);
                    cbck(null, version);
                });
            },
            function(err, versions) {
                // also remove any instances where the original image is attached to articles as an 'Original' version
                image.deleteVersion(originalId, false, function(err2, res) {
                    callback(err2, orig);
                });
            });
        },
        function (orig, callback) {
            log.info('deleting original from db');
            db.remove(originalId, orig._rev, function (err, res) {
                callback(err, orig);
            });
        },
        function (orig, callback) {
            var url = urllib.parse(orig.url);
            log.info('deleting original from s3');
            api.s3.del(IMAGE_BUCKET, url.pathname, function(err) {
                callback(err, orig);
            });
        },
        function (orig, callback) {
            var url = urllib.parse(orig.thumbUrl);
            log.info('deleting thumb from s3');
            api.s3.del(IMAGE_BUCKET, url.pathname, callback);
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
        function (docs, callback) {
            docs = _.filter(_.values(docs), function (doc) {
                return typeof doc != 'function' && typeof doc != 'undefined';
            });

            callback(null, docs);
        }
    ], topCallback);
};

image.docsForVersion = function (versionId, topCallback) {
    async.waterfall([
        function (callback) {
            db.image.docsForVersion(versionId, callback);
        },
        function (docs, callback) {
            var docs = _.filter(_.values(docs), function (doc) {
                return typeof doc != 'function' && typeof doc != 'undefined';
            });
            docs = _.map(docs, function (doc) {
                return doc.value;
            });

            callback(null, docs);
        }],
        topCallback);
};

image.originalsForPhotographer = function (photog, callback) {
    db.image.originalsForPhotographer(photog, callback);
};

image.getOriginals = function (limit, beforeKey, beforeID, callback) {
    db.image.listOriginalsByDate(limit, beforeKey, beforeID, function (err, res) {
        if (err) callback(err);
        else {
            res = _.map(res, function (doc) {
                doc.value.displayName = doc.value.name.replace(/\w*-/, '');
                return doc.value;
            });
            callback(null, res);
        }
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
            api.s3.put(IMAGE_BUCKET, data, imageName, imageType, null, callback);
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
            api.s3.put(IMAGE_BUCKET, data, thumbName, imageType, null,
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
