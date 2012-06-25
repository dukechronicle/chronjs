var poll = exports;

var db = require('./db-abstract');
var log = require('../../log');


poll.add = function (fields, callback) {
    db.save(fields, callback);
};

poll.edit = function (id, fields, callback) {
    db.merge(id, fields, callback);
};

poll.getPoll = function (id, callback) {
    db.get(id, callback);
};

poll.getBySection = function (taxonomy, limit, callback) {
    query = {
        descending: true,
        startkey: [taxonomy, {}],
        endkey: [taxonomy]
    };
    if (limit) query.limit = limit;

    db.view('polls/taxonomy', query, callback);
};

poll.getByTitle = function (title, callback) {
    db.view('polls/title', { key: title }, callback);
};

poll.getByVotes = function (descending, limit, callback) {
    var query = {};
    if (descending)
        query.descending = true;
    if (limit)
        query.limit = limit;

    db.view('polls/votes', query, callback);
};
