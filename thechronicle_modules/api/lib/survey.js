var survey = exports;

var db = require('../../db-abstract');


survey.vote = function (id, answer, callback) {
    db.survey.getSurvey(id, function (err, doc) {
        if (err)
            callback(err);
        else if (! (answer in doc.results))
            callback(answer + ' is not an option for survey ' + id);
        else {
            doc.results[answer]++;
            db.survey.edit(doc._id, doc._rev, doc, callback);
        }
    });
};

survey.setSection = function (id, taxonomy, callback) {
    db.survey.edit(id, { taxonomy: taxonomy }, callback);
};

survey.getSurvey = function (id, callback) {
    db.survey.getSurvey(id, callback);
};

survey.getBySection = function (taxonomy, limit, callback) {
    db.survey.getBySection(taxonomy, { limit: limit }, callback);
};

survey.getByTitle = function (title, callback) {
    db.survey.getByTitle(title, {}, callback);
};

survey.getByVotes = function (descending, query, callback) {
    query = query || {};
    if (descending) query.desending = true;
    db.survey.getByVotes(query, callback);
};

survey.getByDate = function (query, callback) {
    db.survey.getByDate(query, callback);
};
