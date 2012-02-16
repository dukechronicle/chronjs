var survey = exports;


survey.add = function (title, answers, taxonomy, callback);
survey.edit = function (id, fields, callback);
survey.getSurvey = function (id, callback);
survey.getBySection = function (taxonomy, query, callback);
survey.getByTitle = function (title, query, callback);
survey.getByVotes = function (query, callback);
survey.getByDate = function (query, callback);
