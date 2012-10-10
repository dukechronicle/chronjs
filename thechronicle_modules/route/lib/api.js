var siteApi = exports;

var api = require('../../api')
var log = require('../../log')

var _ = require('underscore');

var RESULTS_LIMIT = 30;

/**
 * Responds with the articles currently in the front page slider, and the most popular.
 */
siteApi.articlesForQduke = function (req, res, next) {
    api.site.getQdukeContent(function (err, model){
        if (err) next(err);
        else {
            console.log(model);
            docs = _.pick(model, 'Breaking', 'Slideshow', 'Top Headline', 'Popular');
            console.log(docs);
            res.json({docs: docs});
        }
    });
};

/**
 * Responds with most recent articles within a section. If no section is given,
 * it will respond will the most recent from all sections. A start key can be
 * given for pagination.
 */
siteApi.articlesBySection = function (req, res, next) {
    var taxonomy = req.params.length && req.params.toString().split('/');
    var start = req.query.start && JSON.parse(req.query.start);
    api.article.getByTaxonomy(taxonomy, RESULTS_LIMIT, start, function (err, docs, nextKey) {
        if (err) next(err);
        else {
            docs = _.map(docs, function (doc) {
                return _.pick(doc, 'title', 'teaser', 'urls', '_id', 'created',
                              'authors', 'date');
            });
            res.json({docs: docs, next: JSON.stringify(nextKey)});
        }
    });
};

/**
 * Responds with the article for a given url. Images associated with the article
 * are included with the URLs to them.
 */
siteApi.articleByUrl = function (req, res, next) {
    api.article.getByUrl(req.params.url, function (err, doc) {
        if (err) next(err);
        else res.json(doc);
    });
};

/**
* Uses the docsBySearchQuery function inside the search module in api.js
* Sorts by either relavence or date (ascending or descending)
*@params req, http response
*/
siteApi.searchArticles = function (req, res, next) {
    var query = req.query.q.replace(/-/g, ' ');
    var page = (req.query.start && parseInt(req.query.start)) || 1;
    api.search.docsBySearchQuery(query, req.query.sort, req.query.order, req.query.facets, page, true, function (err, docs, facets) {
        if (err) next(err);
        else res.json({docs: docs, facets: facets, next: page + 1});
    });
};

siteApi.articlesByAuthor = function (req, res, next) {
    var name = req.params.query;
    var start = req.query.start && JSON.parse(req.query.start);
    api.article.getByAuthor(name, null, RESULTS_LIMIT, start, function (err, docs, nextKey) {
        if (err) next(err);
        else res.json({docs: docs, next: JSON.stringify(nextKey)});
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
    api.article.delete(req.params.id, req.body.rev, function (err) {
        if (err) res.send(err, 500);
        else res.send({status: 'success'});
    });
};

siteApi.votePoll = function (req, res, next) {
    if (! ('polls' in req.session))
        res.send("Must vote from a browser", 403);
    else if (req.params.id in req.session.polls)
        res.send("Already voted", 403);
    else
        api.poll.vote(req.params.id, req.body.answer, function (err, _res) {
            if (err) res.send(err, 500);
            else {
                req.session.polls[req.params.id] = true;
                res.send(_res);
            }
        });
};

siteApi.template = function (req, res, next) {
    if (req.params.name in api.page.templates) {
        res.json(api.page.templates[req.params.name].model);
    }
    else {
        next();
    }
};