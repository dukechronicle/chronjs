var db = require('./db-abstract');

var database = exports;

database.findDuplicateUrls = function() {
    var query = {
        startkey:[authorName, {}],
        endkey:[authorName],
        descending:true,
        limit:count,
        include_docs:true
    };


    db.view('articles/authors_and_taxonomy', query,
            function (err, res) {
                callback(err, _.pluck(res, 'doc'));
            }
    );
}
