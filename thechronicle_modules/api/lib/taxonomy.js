var taxonomy = exports;

var api = require('../../api');
var config = require('../../config');
var db = require('../../db-abstract');
var log = require('../../log');

var _ = require('underscore');
var async = require('async');


taxonomy.getTaxonomyTree = function(taxonomyPath) {
    var tree = config.get("TAXONOMY");
    if (taxonomyPath) {
        _.each(taxonomyPath, function (section) {
            try {
                tree = tree[section];
            } catch (err) {
                tree = undefined;
            }
        });
    }
    return tree;
};

taxonomy.getParents = function(taxonomyPath, callback) {
    var parents = [];
    var taxonomyPath = _.clone(taxonomyPath);
    while (taxonomyPath.length > 1) {
        var parentName = taxonomyPath.pop();
        parents.push({path:'/' + taxonomyPath.join('/'), name:parentName});
    }
    callback(null, parents.reverse());
};

taxonomy.getChildren = function(taxonomyPath, callback) {
    var path = taxonomyPath.join('/');
    var tree = taxonomy.getTaxonomyTree(taxonomyPath);

    if (!tree) return callback("Taxonomy not valid: " + path);

    var children = _.map(tree, function (key, value) {
        var child = {};
        child[path + '/' + value] = value;
        return child;
    });
    callback(null, children);
};

taxonomy.getTaxonomyListing = function (callback) {
    var tree = taxonomy.getTaxonomyTree();
    var sections = {};
    _.forEach(tree, function (value, key) {
        var listing = {}, path = [key];
        listing[JSON.stringify(path)] = key;
        getTaxonomyListingHelper(value, listing, path, 1);
        sections[key] = listing;
    });
    callback(null, sections);
};

function getTaxonomyListingHelper(tree, listing, path, depth) {
    _.forEach(tree, function (value, key) {
        var dashes = "";
        for (var i = 0; i < depth; i++)
            dashes += "-";
        path.push(key);
        listing[JSON.stringify(path)] = dashes + "  " + key;
        getTaxonomyListingHelper(value, listing, path, depth + 1);
        path.pop();
    });
    return listing;
}

taxonomy.getHierarchy = function (callback) {
    db.taxonomy.getHierarchy(function (err, res) {
        if (err) return callback(err);
        callback(null, _.map(res, function (entry) { return entry.key }));
    });
};

taxonomy.getHierarchyTree = function (callback) {
    taxonomy.getHierarchy(function (err, res) {
        if (err) return callback(err);
        var root = {};
        _.each(res, function (tax) {
            var top = root;
            _.each(tax, function (node) {
                if (!(node in top))
                    top[node] = {};
                top = top[node];
            });
        });
        callback(null, root);
    });
};
