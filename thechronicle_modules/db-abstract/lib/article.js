var db = require('./db-abstract');
var log = require('../../log');

var _ = require('underscore');

var article = exports;


article.getDuplicates = function (limit, callback) {
    var query = {
        descending: true    
    };

    if (limit)
        query.limit = limit;

    db.view("articles/duplicates", query, callback);
};

article.getByDate = function (limit, start, callback) {
    var query = {
        descending: true,
    };

    if (limit)
        query.limit = limit;
    if (start && _.isObject(start) && start.key)
        query.startkey = start.key;
    if (start && _.isObject(start) && start.id)
        query.startkey_docid = start.id;
    if (start && _.isString(start))
        query.startkey = start;

    db.view('articles/date', query, callback);
};

article.getByTaxonomy = function (taxonomyTerm, limit, start, callback) {
    var query = {
        descending: true,
        startkey: [taxonomyTerm, {}],
        endkey: [taxonomyTerm]
    };

    if (limit)
        query.limit = limit;
    if (start && start.key)
        query.startkey = start.key;
    if (start && start.id)
        query.startkey_docid = start.id;

    db.view('articles/taxonomy', query, callback);
};

article.getByAuthor = function (author, limit, start, callback) {
    author = author.toLowerCase().replace(/-/g, ' ');
    var query = {
        descending: true,
        startkey: [author, {}],
        endkey: [author]
    };

    if (limit)
        query.limit = limit;
    if (start && start.key)
        query.startkey = start.key;
    if (start && start.id)
        query.startkey_docid = start.id;

    db.view('articles/authors', query, callback);
};
