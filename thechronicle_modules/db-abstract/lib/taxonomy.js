var db = require('./db-abstract');
var async = require('async');
var _ = require('underscore');
var log = require('../../log');

var taxonomy = exports;

taxonomy.docs = function(taxonomyTerm, limit, start, callback) {
    var query = {
        descending: true,
        startkey: [taxonomyTerm, {}],
        endkey: [taxonomyTerm],
    };

    if (limit)
        query.limit = limit;
    if (start && start.key)
        query.startkey = start.key;
    if (start && start.id)
        query.startkey_docid = start.id;

    db.view('articles/taxonomy', query, callback);
};

taxonomy.getHierarchy = function (callback) {
    db.view('articles/taxonomy_tree', {group:true}, callback);
};
