var survey = exports;

var db = require('./db-abstract');
var globalFunctions = require('../../global-functions');

var _ = require('underscore');


survey.add = function (title, answers, taxonomy, callback) {
    var survey = {
        title: title,
        taxonomy: taxonomy,
        created: globalFunctions.getTimestamp(),
        type: 'survey',
        results: _.reduce(answers,
                          function (memo, answer) { memo[answer] = 0 },
                          {});
    };        
    db.save(survey, callback);
};

survey.edit = function (id, rev, fields, callback) {
    if (rev)
        db.merge(id, rev, fields, callback);
    else
        db.get(id, function (err, doc) {
            if (err) callback(err);
            else db.merge(doc._id, doc._rev, fields, callback);
        });
};

survey.getSurvey = function (id, callback) {
    db.get(id, callback);
};

survey.getBySection = function (taxonomy, query, callback) {
    query = query || {};
    if (query.descending) {
        query.startkey = [taxonomy];
        query.endkey = [taxonomy, {}];
    }
    else {
        query.startkey = [taxonomy, {}];
        query.endkey = [taxonomy];
    }
    db.view('survey/taxonomy', query, callback);
};

survey.getByTitle = function (title, query, callback) {
    query = query || {};
    query.key = title;
    db.view('survey/title', query, callback);
};

survey.getByVotes = function (query, callback) {
    query = query || {};
    db.view('survey/votes', query, callback);
};

survey.getByDate = function (query, callback) {
    query = query || {};
    db.view('survey/date', query, callback);
};
