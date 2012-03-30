var poll = exports;

var db = require('../../db-abstract');
var log = require('../../log');

var _ = require('underscore');

poll.add = function(fields, callback) {
	db.poll.add(fields.title, fields.answers, fields.taxonomy, callback);
}

poll.vote = function (id, answer, callback) {
    db.poll.getPoll(id, function (err, doc) {
        if (err)
            callback(err);
        else if (! (answer in doc.answers))
            callback(answer + ' is not an option for poll ' + id);
        else {
            doc.answers[answer]++;
            db.poll.edit(id, doc, callback);
        }
    });
};

poll.setSection = function (id, taxonomy, callback) {
    db.poll.edit(id, { taxonomy: taxonomy }, callback);
};

poll.getPoll = function (id, callback) {
    db.poll.getPoll(id, function (err, res) {
        if (err)
            callback(err);
        else if (res.length == 0)
            callback('No poll found with id: ' + id);
        else
            callback(null, res);
    });
};

poll.getBySection = function (taxonomy, limit, callback) {
    var query = {};
    if (limit != undefined) query.limit = limit;
    db.poll.getBySection(taxonomy, query, function (err, res) {
        if (err) callback(err);
        else callback(null, _.map(res, function (doc) { return doc.value }));
    });
};

poll.getByTitle = function (title, callback) {
    db.poll.getByTitle(title, {}, function (err, res) {
        if (err) callback(err);
        else callback(null, _.map(res, function (doc) { return doc.value }));
    });
};

poll.getByVotes = function (descending, query, callback) {
    query = query || {};
    if (descending) query.desending = true;
    db.poll.getByVotes(query, function (err, res) {
        if (err) callback(err);
        else callback(null, _.map(res, function (doc) { return doc.value }));
    });
};

poll.getByDate = function (query, callback) {
    db.poll.getByDate(query, function (err, res) {
        if (err) callback(err);
        else callback(null, _.map(res, function (doc) { return doc.value }));
    });
};
