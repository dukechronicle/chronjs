var survey = exports;

var db = require('./db-abstract');
var globalFunctions = require('../../global-functions');
var log = require('../../log');

var _ = require('underscore');


survey.add = function (title, answers, taxonomy, callback) {
    var survey = {
        title: title,
        taxonomy: taxonomy,
        created: globalFunctions.getTimestamp(),
        type: 'survey',
        answers: _.reduce(answers,
                          function (memo, answer) { memo[answer] = 0 },
                          {})
    };        
    db.save(survey, callback);
};

survey.edit = function (id, fields, callback) {
    db.merge(id, fields, callback);
};

survey.getSurvey = function (id, callback) {
    db.get(id, callback);
};

survey.getBySection = function (taxonomy, query, callback) {
    query = query || {};
    if (query.descending) {
        query.startkey = [taxonomy, {}];
        query.endkey = [taxonomy];
    }
    else {
        query.startkey = [taxonomy];
        query.endkey = [taxonomy, {}];
    }
    db.view('surveys/taxonomy', query, callback);
};

survey.getByTitle = function (title, query, callback) {
    query = query || {};
    query.key = title;
    db.view('surveys/title', query, callback);
};

survey.getByVotes = function (query, callback) {
    query = query || {};
    db.view('surveys/votes', query, callback);
};

survey.getByDate = function (query, callback) {
    query = query || {};
    db.view('surveys/date', query, callback);
};
