var html = require('htmlparser');
var url = require('url');
var http = require('http');
var sys = require('sys');

var url = url.parse("http://sports.chronicleblogs.com/feed/");

var options = {
    host: url.hostname,
    port: 80,
    path: url.pathname
};


http.get(options, function(res) {
    var data = "";
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
        data += chunk;
    });
    res.on('close', function(err) {
        console.log(err);
    });
    res.on('end', function() {
        var handler = new html.RssHandler(function(err, dom) {
            if(err) console.log(err);
            else {
                sys.puts(sys.inspect(dom, false, null));
            }
        });
        
        var parser = new html.Parser(handler);
        parser.parseComplete(data);
    });
});


