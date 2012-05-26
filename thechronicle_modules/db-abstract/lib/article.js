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

article.getByUrl = function (url, callback) {
    var query = {
        startkey: [url],
        endkey: [url, {}],
        include_docs: true
    };

    db.view("articles/urls", query, callback);
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

article.getByTaxonomy = function (taxonomyTerm, limit, params, callback) {
    var query = {
        descending: true,
        startkey: [taxonomyTerm, {}],
        endkey: [taxonomyTerm]
    };

    if (limit)
        query.limit = limit;
    if (params && params.key)
        query.startkey = params.key;
    if (params && params.id)
        query.startkey_docid = params.id;

    // params.last may be an ending date -- used by news sitemap
    if (params && params.last)
        query.endkey = [taxonomyTerm, params.last]

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
