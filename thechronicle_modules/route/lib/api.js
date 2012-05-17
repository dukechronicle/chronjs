var siteApi = exports;

var api = require('../../api')
var log = require('../../log')

var _ = require('underscore');

/**
* Gets top articles of the day.
*@params http request, http response
*/
siteApi.listAll = function (req, res, next) {
    api.article.getByDate(null, null, function(err, docs) {
        if (err) next(err);
        else {
            var result = _.map(docs, function (doc) {
                return {"title":doc.title, "teaser":doc.teaser, "urls":doc.urls, "_id":doc._id, "created":doc.created};
            });
            res.json({docs: result});
        }
    });
};

/**
* Gets articles within a section.
*@params http request, http response
*/
siteApi.listSection = function (req, res, next) {
    var sectionArray = req.params.toString().split('/');
    var start = req.query.start && JSON.parse(req.query.start);
    api.article.getByTaxonomy(sectionArray, 15, start, function (err, docs, nextKey) {
        if (err) next(err);
        else {
            docs = _.map(docs, function (doc) {
                return _.pick(doc, 'title', 'teaser', 'urls', '_id', 'created',
                              'authors', 'query_key');
            });
            res.json({docs: docs, next: JSON.stringify(nextKey)});
        }
    });
};

/**
* Grabs the article for a given url
*@params http request, http response
*/
siteApi.articleByUrl = function (req, res, next) {
    api.article.getByUrl(req.params.url, function (err, doc) {
        if (err) next(err);
        else {
            var result = { 
                "title": doc.title,
                "urls": doc.urls,
                "renderedBody": doc.renderedBody,
                "author": doc.author,
                 "_id":doc._id,
                 "images": doc.images
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
    var query = req.query.q.replace(/-/g, ' ');
    var page = (req.query.start && parseInt(req.query.start)) || 1;
    api.search.docsBySearchQuery(query, req.query.sort, req.query.order, req.query.facets, page, true, function (err, docs, facets) {
        if (err) next(err);
        else res.json({docs: docs, facets: facets, next: page + 1});
    });
};

siteApi.staff = function (req, res, next) {
    var nameQuery = req.params.query.replace('-', ' ');
    var page = (req.query.start && parseInt(req.query.start)) || 1;
    api.search.docsByAuthor(nameQuery, 'desc', '', page, function (err, docs, facets) {
        if (err) next(err);
        else res.json({docs: docs, facets: facets, next: page + 1});
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
    api.article.add(req.body, function (err, _res) {
        if (err) res.send(err, 500);
        else res.send({url: _res});
    });
};

siteApi.updateArticle = function (req, res, next) {
    api.article.edit(req.body.id, req.body, function (err, _res) {
        if (err) res.send(err, 500);
        else res.send({url: _res});
    });
};

siteApi.deleteArticle =  function (req, res, next) {
    api.article.delete(req.params.id, function (err) {
        if (err) res.send(err, 500);
        else res.send({status: 'success'});
    });
};
