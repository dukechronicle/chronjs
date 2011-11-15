var html = require('htmlparser');
var url = require('url');
var http = require('http');
var redis = require('../../redisclient');

exports.parseRSS = function(feed, callback) {
    var urlobj = url.parse(feed);

    var options = {
        host: urlobj.hostname,
        port: urlobj.path,
        path: urlobj.pathname
    };
    
    if(urlobj.search) options.path += urlobj.search;

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

exports.storeRSS = function(dom, title, callback) {
    redis.init(function(err) {
        var json = JSON.stringify(dom);
        redis.client.set(title, json, callback);
    });
    
}

exports.getRSS = function(title, callback) {
    redis.init(function(err) {
        redis.client.get(title, function(err, res) {
            if(err) callback(err, null);
            else {
                var obj = eval('(' + res + ')');
                callback(null, obj);
            }
        });
    });
}
