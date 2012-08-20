var xhrproxy = exports;

var http = require('http');
var https = require('https');


xhrproxy.delete_activity = function(req, res, next) {
    var path = "/" + req.query.activity_id + "?access_token=" + req.query.access_token;
    var options = {
        host: 'graph.facebook.com',
        port: 443,
        path: path,
        method: 'DELETE'
    };
    https.request(options, function(http_res) {
        var data = "";
        http_res.setEncoding('utf8');
        http_res.on('data', function (chunk) {
            data += chunk;
        });
        http_res.on('end', function() {
            res.send(data);
        })
    }).on('error', function(e) {
            res.send(500);
        }).end();
}