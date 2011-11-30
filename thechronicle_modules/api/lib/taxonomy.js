var db = require('../../db-abstract');
var _ = require('underscore');
var config = require('../../config');

var taxonomy = exports;

var MAIN_SECTIONS = config.get("TAXONOMY_MAIN_SECTIONS");

// sections that exists, but that we don't want to show up in the taxonomy
var BAD_SECTIONS = config.get("TAXONOMY_BAD_SECTIONS");

taxonomy.getMainSections = function() {
    return _.extend({}, MAIN_SECTIONS);
};

// get all document under given taxonomy path ex. ["News", "University"]
taxonomy.docs = function (taxonomyPath, limit, callback) {
    db.taxonomy.docs(taxonomyPath, limit, callback);
};

taxonomy.getParentAndChildren = function (navTree, callback) {
    db.taxonomy.getChildren(navTree, function (err, results) {
        if (err) return callback(err, null);
        else {
            var children = {};
            _.forEach(
                    _.filter(
                            _.pluck(results, 'key'),
                            function (child) {
                                return child.length === navTree.length + 1;
                            }
                    ),
                    function (child) {
                        var childPath = child.join('/');

                        children[childPath] = child[child.length - 1];
                    }
            );

            Object.keys(children).forEach(function (key) {
                if (BAD_SECTIONS.indexOf(key) !== -1) {
                    delete children[key];
                }
            });

            var parentPaths = [];

            while (navTree.length > 1) {
                var parentName = _.last(navTree);
                navTree.pop();
                var prefix = "/section/";
                if (navTree.length < 2) prefix = "/";
                parentPaths.push({path:prefix + navTree.join('/'), name:parentName});
            }

            callback(err, {children:children, parentPaths:parentPaths.reverse()});
        }
    });
};
