var db = require('./db-abstract');
var _ = require('underscore')

var authors = exports;

authors.getLatest = function(authorName, count, callback) {
    var query = {
        startkey: [authorName, {}],
        endkey: [authorName],
        descending: true,
        limit: count,
        include_docs: true,
        stale: "ok"
    };
    
    db.view('articles/authors', query,
        function(err, res) {
            callback(err, _.pluck(res, 'doc'));
        }
    );
}