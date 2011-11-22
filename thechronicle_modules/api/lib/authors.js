var db = require('../../db-abstract');

var authors = exports;

authors.getLatest = function (authorName, count, callback) {
    db.authors.getLatest(authorName, count, callback);
};