var db = require('../../db-abstract');
var async = require('async');
var fs = require('fs');
var im = require('imagemagick');
var _ = require("underscore");
var s3 = require('./s3.js');
var urllib = require('url');

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

image.articlesForVersion = function (versionId, topCallback) {
    async.waterfall([
        function (callback) {
            db.image.articleImages(versionId, callback);
        },
        function (articles, callback) {
            console.log(articles);
            // async.map(articles, function (article, cbck) {
            //     
            //     cbck(null, article.value);
            // },
            // callback);
            for (var i in articles) {
                console.log(articles[i].value);
            }
            callback(null);
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
