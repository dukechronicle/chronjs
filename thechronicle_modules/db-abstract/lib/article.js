var db = require('./db-abstract');

var article = exports;

article.getDuplicates = function(limit, callback) {
    var options = {
        limit: limit,
        descending: true    
    };
    
    db.view("articles/duplicates", options, callback);
};
