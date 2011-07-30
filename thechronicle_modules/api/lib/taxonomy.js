var db = require('../../db-abstract');

var taxonomy = exports;

// get all document under given taxonomy path ex. ["New", "University"]
taxonomy.docs = function(taxonomyPath, limit, callback) {
    db.taxonomy.docs(taxonomyPath, limit, callback);
}