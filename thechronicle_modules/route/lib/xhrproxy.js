var xhrproxy = exports;

var http = require('http');
var https = require('https');
var url = require('url');

var log = require('../../log');

var ESPN_URL = 'http://espn.go.com/college-football/team/_/id/150/duke-blue-devils';


xhrproxy.delete_activity = function(req, res, next) {
    var path = "/" + req.query.activity_id + "?access_token=" + req.query.access_token;
    var options = {
        host: 'graph.facebook.com',
        port: 443,
        path: path,
        method: 'DELETE',
        secure: true,
    };
    sendRequest(options, function (err, body) {
        if (err) res.send(err, 500);
        else res.send(body);
    });
}

xhrproxy.espn = function (req, res, next) {
    var urlParams = url.parse(ESPN_URL);
    var options = {
        host: urlParams.host,
        path: urlParams.path,
    };
    sendRequest(options, function (err, body) {
        if (err) res.send(err, 500);
        else res.send(body);
    });
};

function sendRequest(options, callback) {
    var client = options.secure ? https : http;
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