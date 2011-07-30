var db = require('./db-abstract');

var taxonomy = exports;
taxonomy.docs = function(taxonomyPath, callback) {
    var query = {
        startkey: taxonomyPath,
        endkey: taxonomyPath.concat({})
    };

    db.view(
        'articles/tree',
        query,
        function(err, result) {
            if (err) callback(err);
            else callback(err, result);
        }
    );
};