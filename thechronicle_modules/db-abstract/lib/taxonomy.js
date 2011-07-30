var db = require('./db-abstract');

var taxonomy = exports;
taxonomy.get = function(callback) {
    db.view('articles/tree',
    function(err, result) {
        if (err) callback(err);
        else callback(err, result);
    });
};