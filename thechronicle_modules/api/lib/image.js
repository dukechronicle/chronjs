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

image.createOriginal = function(name, url, localPath, callback) {
    var options = {
        url: url,
        localPath: localPath
    };
    db.image.createOriginal(name, options, callback);
}

image.createVersion = function(parentId, url, callback) {
    var options = {
        url: url
    };
    db.image.createVersion(parentId, options, callback);
}