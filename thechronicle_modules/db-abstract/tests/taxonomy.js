var config = require('../../config');

config.sync(function() {
    var taxonomy = require("../lib/taxonomy.js");
    taxonomy.docs(["News"], function(err, res) {console.log(res)});
    taxonomy.docs(["Sports"], function(err, res) {console.log(res)});
});