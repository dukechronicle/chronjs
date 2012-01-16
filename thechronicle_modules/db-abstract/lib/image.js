var db = require('./db-abstract');
var image = exports;

var RESULTS_PER_PAGE = 25;

image.listOriginalsByDate = function (beforeKey, beforeID, callback) {
    var query = {
        descending:true,
        limit: RESULTS_PER_PAGE
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

image.edit = function (imageID, data, callback) {
    db.merge(imageID, data, callback);
};

image.originalsForPhotographer = function (photog, callback) {
    db.view('articles/photographers', {
        key:photog
    }, callback);
};
