var db = require('../../db-abstract');

var authors = exports;

authors.getLatest = function(authorName, count, callback) {
    console.log("called api authors");
    db.authors.getLatest(authorName, count, callback);
}