var db = require('./db-abstract');

var authors = exports;

authors.getLatest = function(authorName, count, callback) {
    var query = {
        startkey: [authorName, {}],
        endkey: [authorName],
        descending: true
    };
    
    db.view('articles/authors', query,
        function(err, res) {
            console.log(res);
            callback(err, res);
        }
    );
}