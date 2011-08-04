var config = require('../../config');

config.sync(function() {
    var taxonomy = require("../lib/taxonomy.js");
    taxonomy.docs("News", null, function(err, res) {console.log(res)});
    taxonomy.docs("Sports", 2, function(err, res) {console.log(res)});
});