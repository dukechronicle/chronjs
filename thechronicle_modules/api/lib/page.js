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

page.add = function (data, callback) {
    if (! ("node_title" in data)) callback("Title for page required");

    data.type = "page";

    db.page.add(data, function (err, res) {
        if (err) callback(err);
        else callback(null, res.node_title);
    });
};

page.edit = function (id, data, callback) {
    db.page.edit(id, data, function (err, res) {
        if (err) callback(err);
        else callback(null, res.node_title);
    });
};
