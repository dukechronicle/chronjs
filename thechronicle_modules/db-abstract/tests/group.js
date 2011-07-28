var config = require('../../config');

config.sync(function() {
    var group = require("../lib/group.js");
    group.docs("dean", null, function(err, res) {console.log(res)});
});