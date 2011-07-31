var config = require('../../config');

config.sync(function() {
    var group = require("../lib/group.js");

    // fetch all groups with namespace dean
    //group.docs("dean", null, function(err, res) {console.log(res)});

    // fetch all groups with namespace dean and group name test
    group.docs(["Layouts", "Frontpage"], "Slideshow", function(err, res) {
    //console.log(res);
    });

     // fetch all groups with namespace dean and group name test
    group.docs(["Layouts", "Frontpage"], null, function(err, res) {
    //console.log(res);
    });
});