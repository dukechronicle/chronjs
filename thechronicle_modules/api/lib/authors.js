var db = require('../../db-abstract');

var authors = exports;

authors.getLatest = function (authorName, count, callback) {
    console.log("getLatest " + authorName + " start")
    db.authors.getLatest(authorName, count, function(err, articles) {
        // remove body text since it will not be used
        articles.forEach(function(article){
            delete article['body'];
            delete article['renderedBody'];
        });
        console.log("getLatest " + authorName + " end")
        callback(err, articles);
    });
};