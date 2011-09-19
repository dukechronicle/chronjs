var db = require('./db-abstract');

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

taxonomy.getHierarchy = function(callback) {
    db.view('articles/taxonomy_tree', {group: true}, callback);
}

taxonomy.getChildren = function(path, callback) {
    var query = {
        group: true,
        group_level: path.length + 1,
        startkey: path,
        endkey: path.concat({})
    }
    db.view('articles/taxonomy_tree', query, callback);

}