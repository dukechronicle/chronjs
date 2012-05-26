var db = require('./db-abstract');
var log = require('../../log');

var taxonomy = exports;


taxonomy.getHierarchy = function (callback) {
    db.view('articles/taxonomy_tree', {group:true}, callback);
};
