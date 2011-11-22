var db = require('../../db-abstract');
var _ = require("underscore");

var image = exports;

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
