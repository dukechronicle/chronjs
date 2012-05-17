var db = require('../../db-abstract');
var dateFormat = require('dateformat');
var md = require('node-markdown').Markdown;

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

authors.getColumnists = function (callback) {
    db.authors.getColumnists(callback);
};

authors.setInfo = function(doc, callback) {
    var id = doc.id;
    var fields = {
        name: doc.name,
        bio: doc.bio,
        affiliation: doc.affiliation,
        currentColumnist: doc.currentColumnist == "on",
        tagline: doc.tagline,
        twitter: doc.twitter,
        type: "author"
    };
    fields.renderedBio = md(fields.bio);
    db.authors.setInfo(id, fields, callback);
};