var page = exports;

var db = require('./db-abstract');
var log = require('../../log');

page.getByUrl = function (url, callback) {
    db.view('pages/byUrl', {key: url}, callback);
};

page.listByUrl = function (callback) {
    db.view('pages/byUrl', {}, callback);
};

page.add = function (data, callback) {
    db.save(data, callback);
};

page.edit = function (id, data, callback) {
    db.merge(id, data, callback);
};
