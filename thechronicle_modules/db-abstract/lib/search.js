var db = require('./db-abstract');

var search = exports;

// returns all docs that are not indexed, or are indexed below the passed in version
search.docsIndexedBelowVersion = function(version, count, callback) {
    if (!(count > 0)) count = 30;
    db.view("articles/indexed_by_solr", {endkey: version, inclusive_end: false, limit: count, stale: "ok"}, callback);
}

search.setArticleAsIndexed = function(id,version,callback) {
    db.merge(id, {indexedBySolr: version}, callback);
}
