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
        secure: true,
    };
    sendRequest(options, function (err, body) {
        if (err) res.send(err, 500);
        else res.send(body);
    });
}

function sendRequest(options, callback) {
    var client = secure ? https : http;
    var req = client.request(options, function (res) {
        var body = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function() {
            callback(null, body);
        });
    });
    req.on('error', function (e) {
        callback(e.message);
    });
    req.end();
}