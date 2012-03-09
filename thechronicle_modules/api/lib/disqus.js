var http  = require('http');
var _  = require('underscore');

var config = require('../../config');
var api = require('./api');

var disqus = {};
var exports = module.exports = disqus;

var DISQUS_LIMIT = 10;
var DISQUS_HOST = 'disqus.com';

disqus.listHot = function(limit, callback) {
    if(!limit || limit < 0) limit = DISQUS_LIMIT;

    var options = {
        limit: limit
    };

    makeDisqusRequest('threads/list', 'GET', options, function(err, response) {
        if(err) return callback(err);
        else return getArticlesFromDisqusData(response, callback);        
    });
};

function getArticlesFromDisqusData(disqusData, callback) {
    var ids = _.map(disqusData, function(disqusArticleData) {
        return disqusArticleData.identifiers[0];
    });

    api.docsById(ids, function(err, res) {
        if(err) return callback(err);

        res = _.map(res, function(article) {
            return article.doc;
        });
        res = _.compact(res);

        return callback(null, res);
    });
}

function makeDisqusRequest(func, method, params, callback) {
    var query = '';
    for (key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            query += key + '=' + params[key] + '&'; 
        }
    }
    query += 'api_key=' + config.get('DISQUS_KEY');
    query += '&forum=' + config.get("DISQUS_SHORTNAME");

    var options = {  
        host: DISQUS_HOST,   
        port: 80,   
        method: method.toUpperCase(),
        path: '/api/3.0/' + func + '.json'  
    };

    if(method.toUpperCase() == 'GET') options.path += '?' + query;

    var req = http.request(options, function(res) {  
        var body = '';

        res.on('data', function(chunk) {  
            body += chunk;
        });

        res.on('end', function () {
            var jsonBody = JSON.parse(body);

            if(jsonBody.code !== 0) callback(jsonBody.response);
            else callback(null, jsonBody.response);
        });
    });

    req.on('error', function(e) {  
        callback(e.message); 
    });

    if(method.toUpperCase() == 'POST') req.write(query);

    req.end();   
}
