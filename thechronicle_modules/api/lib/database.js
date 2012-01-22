var db = require('../../db-abstract');

var database = exports;

database.findDuplicateUrls = function() {
   db.database.findDuplicateUrls(function(err, urls) {
        console.log(urls);
   });
};