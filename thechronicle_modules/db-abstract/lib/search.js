var db = require('./db-abstract');

var search = exports;

// returns all docs that are not indexed, or are indexed below the passed in version
search.docsIndexedBelowVersion = function(version,callback) {
    db.view("articles/indexed_by_solr", {endkey: version, inclusive_end: false}, callback);
}

search.setArticleAsIndexed = function(id,version,callback) {
    db.merge(id, {indexedBySolr: version}, callback);
}
