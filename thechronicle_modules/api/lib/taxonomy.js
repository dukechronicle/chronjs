var fs = require('fs');
var db = require('../../db-abstract');
var _ = require('underscore');
var config = require('../../config');
var taxonomyTree = JSON.parse(fs.readFileSync("sample-data/taxonomy.json"));

var taxonomy = exports;

var MAIN_SECTIONS = config.get("TAXONOMY_MAIN_SECTIONS");

// sections that exists, but that we don't want to show up in the taxonomy
var BAD_SECTIONS = config.get("TAXONOMY_BAD_SECTIONS");

taxonomy.getMainSections = function() {
    return MAIN_SECTIONS;
};

// get all document under given taxonomy path ex. ["News", "University"]

taxonomy.docs = function (taxonomyPath, limit, callback) {
    db.taxonomy.docs(taxonomyPath, limit, callback);
};
/*
taxonomy.docs = function(taxonomyPath, limit, callback) {
    console.log(Object.keys(taxonomyTree));
}*/

taxonomy.getParentAndChildren = function(navTree, callback) {
    var currentPath = navTree.join('/');
    var children = [];

    var currentSection = taxonomyTree;
    navTree.forEach(function(section) {
        currentSection = _.compact(_.pluck(currentSection, section))[0];
        if (!currentSection) callback(section + " in " + navTree + "does not exist");
    });

    currentSection.forEach(function(obj) {
        var childElement = {};
        var child = Object.keys(obj)[0];
        var childPath = currentPath + '/' + child;
        childElement[childPath] = child;
        children.push(childElement);
    });
    var parentPaths = [];

    while (navTree.length > 1) {
        var parentName = _.last(navTree);
        navTree.pop();
        var prefix = "/section/";
        if (navTree.length < 2) prefix = "/";
        parentPaths.push({path:prefix + navTree.join('/'), name:parentName});
    }
    callback(null, {children:children, parentPaths:parentPaths.reverse()});
}
/*
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
                if (_.include(BAD_SECTIONS, key)) {
                    delete children[key];
                }
            });
            console.log(children);
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
};*/
