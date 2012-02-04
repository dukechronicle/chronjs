var mobile = exports;

var api = require('../../api');
var log = require('../../log');

var _ = require('underscore');


mobile.section = function (req, res, next) {
    var groupName = req.params.groupname;
    api.taxonomy.docs(groupName, 10, function (err, docs) {
        if (err) next(err);

        var result = _.map(docs, function (doc) {
            return {"title":doc.title, "teaser":doc.teaser, "urls":doc.urls};
        });

        sendResponse(res, req.query.callback, result);
    });
};

mobile.article = function (req, res, next) {
    api.articleForUrl(req.params.url, function (err, doc) {
        if (err) next(err);

        var result = { title: doc.title,
                       url: doc.url,
                       body: doc.body,
                       author: doc.author
                     };

        sendResponse(res, req.query.callback, result);
    });
};

mobile.search = function (req, res, next) {
    var wordsQuery = req.params.query.replace('-', ' ');
    api.search.docsBySearchQuery(wordsQuery, req.query.sort, req.query.order, req.query.facets, req.query.page, function (err, docs, facets) {
        if (err) next(err);
        else {
            var result = { docs: docs, facets: facets };
            sendResponse(res, req.query.callback, result);
        }
    });
};

mobile.staff = function (req, res, next) {
    var nameQuery = req.params.query.replace('-', ' ');
    api.search.docsByAuthor(nameQuery, 'desc', '', req.query.page, function (err, docs, facets) {
        if (err) next(err);
        else {
            var result = { docs: docs, facets: facets };
            sendResponse(res, req.query.callback, result);
        }
    });
};

function sendResponse(res, callback, result) {
    if (callback == null)
        res.send(result);
    else
        res.send(callback + "(" + JSON.stringify(result) + ")");
}
