var page = exports;

var api = require("../../api");
var db = require("../../db-abstract");
var log = require("../../log");

page.getByUrl = function (url, callback) {
    db.page.getByUrl(url, function (err, res) {
        if (err) callback(err);
        else if (res.length == 0) callback();
        else if (res.length == 1) callback(null, res[0].value);
        else callback('Multiple pages found with url: ' + url, res);
    });
};

page.add = function (data, callback) {
    if (!data.url) callback("URL for page required");

    data.type = "page";

    db.page.add(data, function (err, res) {
        if (err) callback(err);
        else callback(null, data.node_title);
    });
};

page.edit = function (id, data, callback) {
    db.page.edit(id, data, function (err, res) {
        if (err) callback(err);
        else callback(null, data.node_title);
    });
};
