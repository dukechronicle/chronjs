var page = exports;

var api = require("../../api");
var db = require("../../db-abstract");
var log = require("../../log");

page.getByUrl = function (url, callback) {
    db.page.getByUrl(url, function (err, res) {
        if (err) callback(err);
        else if (res.length == 0) callback("Node not found: " + url);
        else api.docsById(res[0].id, callback);
    });
};

page.add = db.page.add;
page.edit = db.page.edit;
