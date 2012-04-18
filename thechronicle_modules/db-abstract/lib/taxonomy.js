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

taxonomy.getHierarchyTree = function (callback) {
    taxonomy.getHierarchy(function (error, res) {
        var root = {};
        async.forEach(res,
                function (tax, callback1) {
                    var top = root;
                    async.forEachSeries(tax.key,
                            function (node, callback2) {
                                if (!(node in top))
                                    top[node] = {};
                                top = top[node];
                                callback2();
                            },
                            function (err) {
                                callback1();
                            });
                },
                function (err) {
                    callback(err, root);
                });
    });
};

taxonomy.getChildren = function (path, callback) {
    var query = {
        group:true,
        group_level:path.length + 1,
        startkey:path,
        endkey:path.concat({})
    };
    db.view('articles/taxonomy_tree', query, callback);

};
