var db = require('../../db-abstract');
var dateFormat = require('dateformat');

var authors = exports;

authors.getLatest = function (authorName, taxonomy, count, callback) {
    db.authors.getLatest(authorName, taxonomy, count, function(err, articles) {
        // remove body text since it will not be used
        articles.forEach(function(article){
            if (article.urls) {
                article.url = "/article/" + article.urls[article.urls.length - 1];
            }
            if (article.created) {
                var date = new Date(article.created*1000);
                article.date = dateFormat(date,"mmmm dS, yyyy");
            }
            delete article['body'];
            delete article['renderedBody'];
        });
        callback(err, articles);
    });
};

authors.getInfo = function (authorName, callback) {
    db.authors.getInfo(authorName, callback);
};