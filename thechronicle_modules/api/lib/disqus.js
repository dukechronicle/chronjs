var http  = require('http');
var config = require('../../config');

var disqus = {};
var exports = module.exports = disqus;

var DISQUS_LIMIT = 10;
var DISQUS_HOST = 'disqus.com';

disqus.listHot = function(limit, callback) {
    if(!limit || limit < 0) limit = DISQUS_LIMIT;

    var options = {
        forum: config.get("DISQUS_SHORTNAME"),
        limit: limit
    };

    makeDisqusRequest('threads/listHot', 'GET', options, function(err, response) {
        console.log(err);
        console.log(response);
    });
};

function makeDisqusRequest(func, method, params, callback) {
    var query = '';
    for (key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            query += key + '=' + params[key] + '&'; 
        }
    }
    query += 'api_key=' + config.get('DISQUS_KEY');

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
            else callback(null, jsonBody);
        });
    });

    req.on('error', function(e) {  
        callback(e.message); 
    });

    if(method.toUpperCase() == 'POST') req.write(query);

    req.end();   
}
