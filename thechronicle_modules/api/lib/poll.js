var poll = exports;

var db = require('../../db-abstract');
var util = require('../../util');
var log = require('../../log');

var _ = require('underscore');

poll.add = function (fields, callback) {
    if (!fields.title) return callback("Poll must have title");
    var answers = _.reduce(fields.answers, function (memo, answer) {
        memo[answer] = 0;
        return memo;
    }, {});
    var poll = {
        title: fields.title,
        taxonomy: fields.taxonomy,
        created: util.unixTimestamp(),
        type: 'poll',
        answers: answers
    };
    db.poll.add(poll, callback);
};

poll.edit = function (id, fields, callback) {
    db.poll.edit(id, fields, callback);
}

poll.vote = function (id, answer, callback) {
    db.poll.getPoll(id, function (err, doc) {
        if (err) callback(err);
        else if (! (answer in doc.answers)) {
            callback(answer + ' is not an option for poll ' + id);
        }
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
        if (err) callback(err);
        else if (res.length == 0) {
            callback('No poll found with id: ' + id);
        }
        else callback(null, res);
    });
};

poll.getByTaxonomy = function (taxonomy, limit, callback) {
    taxonomy = taxonomy || [];
    db.poll.getBySection(taxonomy, limit, callbackDocumentValues(callback));
};

poll.getByTitle = function (title, callback) {
    db.poll.getByTitle(title, function (err, res) {
        if (err) callback(err);
        else if (res.length == 0) callback("No polls found");
        else callback(null, res[0].value);
    });
};

poll.getByVotes = function (descending, limit, callback) {
    db.poll.getByVotes(descending, limit, callbackDocumentValues(callback));
};

poll.getByDate = function (limit, callback) {
    poll.getByTaxonomy(null, limit, callback);
};

function callbackDocumentValues(callback) {
    return function (err, res) {
        if (err) callback(err);
        else callback(null, _.map(res, function (doc) { return doc.value }));
    }
}