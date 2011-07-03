var db = require('../../db-abstract');

var image = exports;

image.getOriginal = function(name, callback) {
    db.image.listOriginals({
        key: name
    }, function(err, res) {
        if(err) callback(err, null);
        else {
            if(res.length != 1) callback('Original not found', null);
            else callback(null, res[0]);
        }
    });
}

image.createOriginal = function(name, url, localPath, contentType, metadata, callback) {
    metadata.url = url;
    metadata.localPath = localPath;
    metadata.contentType = contentType;
    db.image.createOriginal(name, metadata, callback);
}

image.createVersion = function(parentId, url, width, height, callback) {
    var options = {
        url: url,
        width: width,
        height: height
    };
    db.image.createVersion(parentId, options, callback);
}

image.originalsForPhotographer = function(photog, callback) {
    db.image.originalsForPhotographer(photog, callback);
}