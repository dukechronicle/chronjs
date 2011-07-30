var db = require('./db-abstract');

var taxonomy = exports;
taxonomy.docs = function(taxonomyPath, limit, callback) {
    var query = {
        startkey: taxonomyPath,
        endkey: taxonomyPath.concat({})
    };

    if (limit) {
        query.limit = limit;
    }

    db.view(
        'articles/tree',
        query,
        function(err, result) {
            if (err) callback(err);
            else callback(err, result);
        }
    );
};