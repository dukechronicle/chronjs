var db = require('./db-abstract');
var image = exports;

image.listOriginals = function(options, callback) {
    db.view('articles/image_originals', options, callback);
}

image.createOriginal = function(name, options, callback) {
    image.listOriginals({
        key: name
    }, function(err, res) {
        if(err) callback(err, null);
        else {
            if(res.length != 0) callback("Name already in use", null);
            else {
                options.type = 'image';
                options.name = name;
                options.imageVersions = [];
                db.save(options, callback);
            }
        }
    });
}

image.createVersion = function(parentId, options, callback) {
    options.type = 'imageVersion';
    options.original = parentId;
    db.save(options, function(err, saveRes) {
        if(err) callback(err, null);
        else {
            var versionId = saveRes.id;
            db.get(parentId, function(err2, doc) {
                if(err2) callback(err2, null);
                else {
                    var versions = doc.imageVersions;
                    versions.push(versionId);
                    db.merge(parentId, {
                        imageVersions: versions
                    },
                    callback);
                }
            });
        }
    });
}

image.originalsForPhotographer = function(photog, callback) {
    db.view('articles/photographers', {
        key: photog
    }, callback);
}
