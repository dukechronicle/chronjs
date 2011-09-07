var db = require('./db-abstract');

var taxonomy = exports;
taxonomy.docs = function(taxonomyTerm, limit, callback) {
    var query = {
        startkey: [taxonomyTerm, {}],
        endkey: [taxonomyTerm],
        descending: true
    };

    if (limit) {
        query.limit = limit;
    }

    db.view(
        'articles/taxonomy',
        query,
        function(err, result) {
            if (err) callback(err);
            else callback(err, result);
        }
    );
};
