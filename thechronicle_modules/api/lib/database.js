var db = require('../../db-abstract');

var database = exports;

database.findDuplicateUrls = function(limit) {
   db.database.findDuplicateUrls(limit, function(err, urls) {
        console.log(urls);
   });
};