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

image.createOriginal = function(name, url, localPath, contentType, callback) {
    var options = {
        url: url,
        localPath: localPath,
        contentType: contentType
    };
    db.image.createOriginal(name, options, callback);
}

image.createVersion = function(parentId, url, width, height, callback) {
    var options = {
        url: url,
        width: width,
        height: height
    };
    db.image.createVersion(parentId, options, callback);
}