var db = require('./db-abstract');
var async = require('async');
var _ = require('underscore');


var taxonomy = exports;
taxonomy.docs = function(taxonomyTerm, limit, callback) {
    var query = {
        startkey: [taxonomyTerm, {}],
        endkey: [taxonomyTerm],
        descending: true
    };

    if (limit) {
        query.limit = limit;
    }

    db.view(
        'articles/taxonomy',
        query,
        function(err, result) {
            if (err) callback(err);
            else callback(err, result);
        }
    );
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

taxonomy.getTaxonomyListing = function (callback) {
    taxonomy.getHierarchy(function (err, res) {
        if (err) callback(err);
        else {
            var listing = { News:{},
                Sports:{},
                Opinion:{},
                Recess:{},
                Towerview:{}
            };
            async.reduce(res, listing,
                    function (memo, item, cb) {
                        var fields = item.key;
                        var dashes = "";
                        for (var i = 0; i < fields.length - 1; i++) dashes += "-";
                        if (fields[0] in memo)
                            memo[fields[0]][JSON.stringify(fields)] =
                                    dashes + " " + fields[fields.length - 1];
                        cb(undefined, memo);
                    }, callback);
        }
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
