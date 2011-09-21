var db = require('../../db-abstract');

var authors = exports;

authors.getLatest = function(authorName, count, callback) {
    console.log("called api authors");
    db.author.getLatest(authorName, count, callback);
}