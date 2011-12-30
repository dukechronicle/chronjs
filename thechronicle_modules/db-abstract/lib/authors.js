var db = require('./db-abstract');
var _ = require('underscore');

var authors = exports;

authors.getLatest = function (authorName, count, callback) {
    var query = {
        startkey:[authorName, {}],
        endkey:[authorName],
        descending:true,
        limit:count,
        include_docs:true
    };

    db.view('articles/authors', query,
            function (err, res) {
                /*
                console.log('-----')
                for (var i = 0; i < res.length; i++) {
                    console.log(res[i].doc.created);
                }
                console.log('--')
                res.forEach(function(result) {
                    console.log(result.created);
                })
                console.log('--')
                _.pluck(res, 'doc').forEach(function(result) {
                    console.log(result.created);
                })*/
                callback(err, _.pluck(res, 'doc'));
            }
    );
};