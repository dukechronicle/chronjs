var db = require('../../db-abstract');

var authors = exports;

authors.getLatest = function (authorName, count, callback) {
    db.authors.getLatest(authorName, count, function(err, articles) {
        // remove body text since it will not be used
        articles.forEach(function(article){
            if (article.urls) {
                article.url = "/article/" + article.urls[article.urls.length - 1];
            }
            delete article['body'];
            delete article['renderedBody'];
        });
        callback(err, articles);
    });
};