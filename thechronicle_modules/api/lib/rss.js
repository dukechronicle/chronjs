var html = require('htmlparser');
var url = require('url');
var http = require('http');
var sys = require('sys');

exports.parseRSS = function(feed, callback) {
    var urlobj = url.parse(feed);

    var options = {
        host: urlobj.hostname,
        port: 80,
        path: urlobj.pathname
    };

    http.get(options, function(res) {
        var data = "";
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('close', function(err) {
            callback(err, null);
        });
        res.on('end', function() {
            var handler = new html.RssHandler(callback);
            var parser = new html.Parser(handler);
            parser.parseComplete(data);
        });
    });
}
