var xhrproxy = exports;

var http = require('http');

xhrproxy.openx = function(req, res, next) {
    var queryParams = "?";

    Object.keys(req.query).forEach(function(key) {
        queryParams += key + "=" + req.query[key] + "&";
    });

    var options = {
        host: 'www.oncampusweb.com',
        port: 80,
        path: '/delivery/' + req.params['path'] + queryParams,
        method: 'GET'
    };

    http.get(options, function(http_res) {
        var pageData = "";
        http_res.setEncoding('utf8');
        http_res.on('data', function (chunk) {
            pageData += chunk;
        });

        http_res.on('end', function(){
            res.send(pageData)
        });
    }).on('error', function(e) {
        console.log("Ad server down: " + e.message);
    });
}