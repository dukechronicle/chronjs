var api = require('../../api');
var db = require('../../db-abstract');
var dateFormat = require('dateformat');
var md = require('discount');

var authors = exports;

authors.getLatest = function (authorName, taxonomy, limit, callback) {
    api.article.getByAuthor(authorName, taxonomy, limit, null, callback);
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
    fields.renderedBio = md.parse(fields.bio);
    db.authors.setInfo(id, fields, callback);
};