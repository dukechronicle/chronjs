var survey = exports;

var db = require('../../db-abstract');
var log = require('../../log');

var _ = require('underscore');


survey.vote = function (id, answer, callback) {
    db.survey.getSurvey(id, function (err, doc) {
        if (err)
            callback(err);
        else if (! (answer in doc.answers))
            callback(answer + ' is not an option for survey ' + id);
        else {
            doc.answers[answer]++;
            db.survey.edit(id, doc, callback);
        }
    });
};

survey.setSection = function (id, taxonomy, callback) {
    db.survey.edit(id, { taxonomy: taxonomy }, callback);
};

survey.getSurvey = function (id, callback) {
    db.survey.getSurvey(id, function (err, res) {
        if (err)
            callback(err);
        else if (res.length == 0)
            callback('No survey found with id: ' + id);
        else
            callback(null, res);
    });
};

survey.getBySection = function (taxonomy, limit, callback) {
    var query = {};
    if (limit != undefined) query.limit = limit;
    db.survey.getBySection(taxonomy, query, function (err, res) {
        if (err) callback(err);
        else callback(null, _.map(res, function (doc) { return doc.value }));
    });
};

survey.getByTitle = function (title, callback) {
    db.survey.getByTitle(title, {}, function (err, res) {
        if (err) callback(err);
        else callback(null, _.map(res, function (doc) { return doc.value }));
    });
};

survey.getByVotes = function (descending, query, callback) {
    query = query || {};
    if (descending) query.desending = true;
    db.survey.getByVotes(query, function (err, res) {
        if (err) callback(err);
        else callback(null, _.map(res, function (doc) { return doc.value }));
    });
};

survey.getByDate = function (query, callback) {
    db.survey.getByDate(query, function (err, res) {
        if (err) callback(err);
        else callback(null, _.map(res, function (doc) { return doc.value }));
    });
};
