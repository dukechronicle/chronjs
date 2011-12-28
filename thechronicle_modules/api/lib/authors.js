var db = require('../../db-abstract');

var authors = exports;

authors.getLatest = function (authorName, count, callback) {
    db.authors.getLatest(authorName, count, function(err, articles) {
        // remove body text since it will not be used
        articles.forEach(function(article){
            delete article['body'];
            delete article['renderedBody'];
        });
        callback(err, articles);
    });
};