var taxonomy = exports;

var _ = require('underscore');
var async = require('async');
var config = require('../../config');
var db = require('../../db-abstract');
var fs = require('fs');
var log = require('../../log');

var RESULTS_PER_PAGE = 25;

// get all document under given taxonomy path ex. ["News", "University"]
// startDoc specifies the document within the taxonomy to start returning data at, for pagination.
taxonomy.docs = function (taxonomyPath, limit, startDoc, callback) {
    limit = limit || RESULTS_PER_PAGE;

    db.taxonomy.docs(taxonomyPath, limit, startDoc, function (err, docs) {
        if (err) callback(err);
        else callback(null, _.map(docs, function(doc){return doc.value}));
    });
};

taxonomy.getTaxonomyTree = function(callback) {
    buildTree(config.get("TAXONOMY"), callback);
};

taxonomy.getTaxonomySubtree = function(taxonomyPath, callback) {
    taxonomy.getTaxonomyTree(function(err, tree) {
	if (err)
	    callback(err);
	else {
	    taxonomyPath.forEach(function (section) {
		try {
		    tree = tree[section];
		} catch (err) {
		    tree = undefined;
		}
	    });
	    if (tree === undefined)
		callback("Taxonomy path not found: " + taxonomyPath);
	    else 
		callback(null, tree);
	}
    });
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
    taxonomy.getTaxonomySubtree(taxonomyPath, function (err, tree) {
	if (err)
	    callback(err);
	else {
	    var children = _.map(tree, function (key, value) {
		var child = {};
		child[path + '/' + value] = value;
		return child;
	    });
	    callback(null, children);
	}
    });
};

taxonomy.getTaxonomyListing = function (callback) {
    taxonomy.getTaxonomyTree(function (err, tree) {
	var taxonomy = {};
	_.forEach(tree, function (value, key) {
	    var listing = {}, path = [key];
	    listing[JSON.stringify(path)] = key;
	    getTaxonomyListingHelper(value, listing, path, 1);
	    taxonomy[key] = listing;
	});
	callback(null, taxonomy);
    });
};

function buildTree(taxonomy, callback) {
    async.reduce(taxonomy, {},
		 function (tree, section, cb) {
		     // should only be one attribute in object
		     for (var key in section) {
			 buildTree(section[key], function (err, subtree) {
			     tree[key] = subtree;
			     cb(err, tree);
			 });
			 break;
		     }
		 },
		 function (err, tree) {
		     callback(err, tree);
		 });
}

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
