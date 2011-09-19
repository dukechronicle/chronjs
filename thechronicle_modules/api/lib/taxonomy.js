var db = require('../../db-abstract');
var _ = require('underscore');

var taxonomy = exports;

// sections that exists, but that we don't want to show up in the taxonomy
var BAD_SECTIONS = ['Graduation Issue','Tennis','Basketball','Soccer','Golf','Lacross'];

// get all document under given taxonomy path ex. ["News", "University"]
taxonomy.docs = function(taxonomyPath, limit, callback) {
    db.taxonomy.docs(taxonomyPath, limit, callback);
}

taxonomy.getParentAndChildren = function(navTree,callback) {



    db.taxonomy.getChildren(navTree, function(err, results){
        console.log(results);
        if (err) return callback(err, null);
        else {
            var children = {};
            _.forEach(
                _.select(
                    _.pluck(results, 'key'),
                    function(child) {
                        return child.length === navTree.length + 1;
                    }
                ),
                function(child) {
                    var childPath = child.join('/');

                    children[childPath] = child[child.length - 1];
                }
            );

            var parentPaths = [];

            while (navTree.length > 1) {
                var parentName = _.last(navTree);
                navTree.pop();
                parentPaths.push({path: '/' + navTree.join('/'), name: parentName});
            }

            callback(err, {children: children, parentPaths: parentPaths.reverse()});
        }
    });
}
