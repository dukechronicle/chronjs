var db = require('./db-abstract');

var group = exports;

// lists all groups with given query options
group.list = function(options, callback) {
    db.view('articles/list_groups', options,
    function(err, res) {
        callback(err, res);
    }
);
}