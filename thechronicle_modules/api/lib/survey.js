var survey = exports;


survey.vote = function (id, answer, callback);
survey.setSection = function (id, taxonomy, callback);
survey.getSurvey = function (id, callback);
survey.getBySection = function (taxonomy, limit, callback);
survey.getByTitle = function (title, callback);
survey.getByVotes = function (query, callback);
survey.getByDate = function (query, callback);