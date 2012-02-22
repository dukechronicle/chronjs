var siteApi = exports;

var api = require('../../api')
var log = require('../../log')

var _ = require('underscore');

/**
* Gets top articles of the day.
*@params http request, http response
*/
siteApi.listAll = function (req, res, next) {
    api.docsByDate(false,false, function mapArticleReponse(err,docs){
		if (err) 
			next(err);
		else {
			var result = _.map(docs, function (doc) {
				return {"title":doc.title, "teaser":doc.teaser, "urls":doc.urls};
			});
			
			sendResponseJSONP(res, req.query.callback, result);
		}
	});
};

/**
* Gets 10 articles within a section.
*@params http request, http response
*/
siteApi.section = function (req, res, next) {
    var section = req.params.section;
    api.taxonomy.docs([section], 10, function mapArticleReponse(err,docs){
		if (err) 
			next(err);
		else {
			var result = _.map(docs, function (doc) {
				return {"title":doc.title, "teaser":doc.teaser, "urls":doc.urls};
			});
			
			sendResponseJSONP(res, req.query.callback, result);
		}
	});
};

/**
* Grabs the article for a given url
*@params http request, http response
*/
siteApi.article = function (req, res, next) {
    api.articleForUrl(req.params.url, function (err, doc) {
        if (err) next(err);
        else {
            var result = { title: doc.title,
                url: doc.url,
                body: doc.body,
                author: doc.author
            };

            sendResponseJSONP(res, req.query.callback, result);
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
        else {
            var result = { docs: docs, facets: facets };
            sendResponseJSONP(res, req.query.callback, result);
        }
    });
};

siteApi.staff = function (req, res, next) {
    var nameQuery = req.params.query.replace('-', ' ');
    api.search.docsByAuthor(nameQuery, 'desc', '', req.query.page, function (err, docs, facets) {
        if (err) next(err);
        else {
            var result = { docs: docs, facets: facets };
            sendResponseJSONP(res, req.query.callback, result);
        }
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

siteApi.deleteDocument =  function (req, res, next) {
    api.deleteDoc(req.params.docId, req.body.rev, function (err) {
        res.send({status: (err == null)});
    });
};

function mapArticleReponse(res,req,err,docs){
	if (err) 
	    next(err);
    else {
        var result = _.map(docs, function (doc) {
            return {"title":doc.title, "teaser":doc.teaser, "urls":doc.urls};
        });
        
        sendResponseJSONP(res, req.query.callback, result);
    }
}
    
function sendResponseJSONP(res, callback, result) {
    if (callback == null)
        res.send(result);
    else
        res.send(callback + "(" + JSON.stringify(result) + ")");
}
