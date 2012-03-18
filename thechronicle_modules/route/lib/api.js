var siteApi = exports;

var api = require('../../api')
var log = require('../../log')

var _ = require('underscore');

/**
* Gets top articles of the day.
*@params http request, http response
*/
siteApi.listAll = function (req, res, next) {
    api.docsByDate(null, null, function(err, docs) {
	    if (err) next(err);
        else {
            var result = _.map(docs, function (doc) {
                return {"title":doc.title, "teaser":doc.teaser, "urls":doc.urls, "_id":doc._id};
            });
            res.json(result);
        }
    });
};

/**
* Gets 10 articles within a section.
*@params http request, http response
*/
siteApi.listSection = function (req, res, next) {
    var section = req.params.section;
    var startDocId = req.query.startDocId;
    api.taxonomy.docs([section], 10, startDocId, function (err, docs) {
        if (err) next(err);
        else {
            var result = _.map(docs, function (doc) {
                return {"title":doc.title, "teaser":doc.teaser, "urls":doc.urls, "_id":doc._id, "created":doc.created, "authors":doc.authors};
            });
            res.json(result);
        }
    });
};

/**
* Grabs the article for a given url
*@params http request, http response
*/
siteApi.articleByUrl = function (req, res, next) {
    api.articleForUrl(req.params.url, function (err, doc) {
        if (err) next(err);
        else {
            var result = { title: doc.title,
                url: doc.url,
                renderedBody: doc.renderedBody,
                author: doc.author
            };
            res.json(result);	  	
        }
    });
};

/**
* Uses the docsBySearchQuery function inside the search module in api.js
* Sorts by either relavence or date (ascending or descending)
*@params req, http response
*/
siteApi.search = function (req, res, next) {
    var wordsQuery = req.params.query.replace('-', ' ');
    api.search.docsBySearchQuery(wordsQuery, req.query.sort, req.query.order, req.query.facets, req.query.page, true, function (err, docs, facets) {
        if (err) next(err);
        else res.json({docs: docs, facets: facets});
    });
};

siteApi.staff = function (req, res, next) {
    var nameQuery = req.params.query.replace('-', ' ');
    api.search.docsByAuthor(nameQuery, 'desc', '', req.query.page, function (err, docs, facets) {
        if (err) next(err);
        else res.json({docs: docs, facets: facets});
    });
};

siteApi.addGroup = function (req, res, next) {
    var docId = req.body.docId;
    var nameSpace = req.body.nameSpace;
    var groupName = req.body.groupName;
    var weight = req.body.weight;

    api.group.add(nameSpace, groupName, docId, weight, function (err, _res) {
        if (err) {
            log.warning(err);
            _res.err = err;
        }
        res.send(_res);
    });
};

siteApi.removeGroup = function (req, res, next) {
    var docId = req.body.docId;
    var nameSpace = req.body.nameSpace;
    var groupName = req.body.groupName;

    api.group.remove(nameSpace, groupName, docId, function (err, _res) {
        if (err) {
            log.warning(err);
            _res.err = err;
        }
        res.send(_res);
    });
};

siteApi.readArticle = function (req, res, next) {
    api.docsById(req.params.id, function (err, _res) {
        if (err) res.send(err, 500);
        else res.json(_res);
    });
};

siteApi.createArticle = function (req, res, next) {
    api.addDoc(req.body, function (err, _res) {
        if (err) res.send(err, 500);
        else res.send(_res);
    });
};

siteApi.updateArticle = function (req, res, next) {
    api.editDoc(req.body.id, req.body, function (err, _res) {
        if (err) res.send(err, 500);
        else res.send(_res);
    });
};

siteApi.deleteArticle =  function (req, res, next) {
    api.deleteDoc(req.params.id, req.body.rev, function (err) {
        if (err) res.send(err, 500);
        else res.send({status: 'success'});
    });
};
