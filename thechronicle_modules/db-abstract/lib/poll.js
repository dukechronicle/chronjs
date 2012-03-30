var poll = exports;

var db = require('./db-abstract');
var globalFunctions = require('../../global-functions');
var log = require('../../log');


poll.add = function (poll, callback) {
    db.save(poll, callback);
};

poll.edit = function (id, fields, callback) {
    db.merge(id, fields, callback);
};

poll.getPoll = function (id, callback) {
    db.get(id, callback);
};

poll.getBySection = function (taxonomy, query, callback) {
    query = query || {};
    if (query.descending) {
        query.startkey = [taxonomy, {}];
        query.endkey = [taxonomy];
    }
    else {
        query.startkey = [taxonomy];
        query.endkey = [taxonomy, {}];
    }
    db.view('polls/taxonomy', query, callback);
};

poll.getByTitle = function (title, query, callback) {
    query = query || {};
    query.key = title;
    db.view('polls/title', query, callback);
};

poll.getByVotes = function (query, callback) {
    query = query || {};
    db.view('polls/votes', query, callback);
};

poll.getByDate = function (query, callback) {
    query = query || {};
    db.view('polls/date', query, callback);
};
