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
    var parent = null;

    if (navTree.length > 1) {
        parent = navTree[navTree.length - 2];
    }

    db.taxonomy.getChildren(navTree, function(err, results){
        if (err) return callback(err, null);
        else {
            var children = _.map(
                _.select(
                    _.pluck(results, 'key'),
                    function(child) {
                        return child.length === navTree.length + 1;
                    }
                ),
                function(child) {
                    return child[child.length - 1];
                }
            );
            console.log(children);
            callback(err, {children: children, parent: parent});
        }
    });
}
