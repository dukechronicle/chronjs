var taxonomy = exports;

var api = require('../../api');
var config = require('../../config');
var db = require('../../db-abstract');
var log = require('../../log');

var _ = require('underscore');
var async = require('async');


/**
 * Finds the taxonomy if it exists and returns a taxonomy node object.
 *
 * @param {Array.<string>} taxonomy The taxonomy array.
 * @return {Object} The taxonomy node object with name, taxonomy, and path
 *     properties or undefined if taxonomy does not exist.
 */
taxonomy.getTaxonomy = function (tax) {
    var node = getTaxonomyNode(tax);
    if (node) {
        delete node.children;
        return node;
    }
    return undefined;
};

/**
 * Get the child taxonomy nodes.
 *
 * @param {Array.<string>} taxonomy The taxonomy array.
 * @return {Array.<Object>} An array of child taxonomy nodes in order.
 */
taxonomy.children = function (tax) {
    var node = getTaxonomyNode(tax);
    if (node) {
        return _.map(node.children, function (child) {
            var fullTaxonomy = _.clone(node.taxonomy);
            fullTaxonomy.push(child.name);
            child = _.extend(child, {
                taxonomy: fullTaxonomy,
                path: taxonomy.path(fullTaxonomy),
            });
            delete child.children;
            return child;
        });
    }
    return undefined;
};

/**
 * Get the parent taxonomy nodes and the given node.
 *
 * @param {Array.<string>} taxonomy The taxonomy array.
 * @return {Array.<Object>} An array of parent taxonomy nodes in order.
 */
taxonomy.parents = function (tax) {
    var node = getTaxonomyNode(tax);
    if (node) {
        tax = node.taxonomy;
        var parents = [];
        while (tax.length > 0) {
            parents.unshift({
                name: _.last(tax),
                taxonomy: _.clone(tax),
                path: taxonomy.path(tax),
            });
            tax.pop();
        }
        return parents;
    }
    return undefined;
};

/**
 * Get a list of the names of the top level taxonomy sections.
 *
 * @return {Array.<string>} The names of the main sections.
 */
taxonomy.mainSections = function () {
    return _.map(taxonomy.children([]), function (node) {
        return node.name;
    });
};

/**
 * Check if a taxonomy is valid.
 *
 * @param {Array.<string>} taxonomy The taxonomy array.
 * @return {boolean} Whether taxonomy exists.
 */
taxonomy.isValid = function (tax) {
    return new Boolean(taxonomy.getTaxonomy(tax));
};

/**
 * Convert a taxonomy into a string path. The path is the lowercased taxonomy
 * components concatenated with '/'.
 *
 * @param {Array.<string>} taxonomy The taxonomy array.
 * @return {string} The taxonomy path.
 */
taxonomy.path = function (tax) {
    return _.map(tax, function (section) {
        return section.toLowerCase();
    }).join('/');
};

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

/**
 * Get all taxonomy sections by level. Format is an array of levels, where each
 * level is an array of taxonomy objects with a name and parent name.
 *
 * @return {Array.<Array.<{name: string, parent: string}>>} The levels array.
 */
taxonomy.levels = function (callback) {
    var current = config.get('TAXONOMY');
    var levels = [];
    while (current.length) {
        var next = [];
        var level = [];
        _.each(current, function (section) {
            level.push(_.pick(section, 'name', 'parent'));
            _.each(section.children, function (child) {
                child.parent = section.name;
            });
            Array.prototype.push.apply(next, section.children);
        });
        levels.push(level);
        current = next;
    };
    return levels;
};

function getTaxonomyNode(tax) {
    var root = {children: config.get('TAXONOMY')};
    var fullTaxonomy = [];

    for (var i = 0; i < tax.length; i++) {
        root = _.find(root.children || [], function (child) {
            return child.name.toLowerCase() === tax[i].toLowerCase();
        });

        if (!root) {
            return null;
        }
        fullTaxonomy.push(root.name);
    }

    return _.extend(root, {
        taxonomy: fullTaxonomy,
        path: taxonomy.path(fullTaxonomy),
    });
};
