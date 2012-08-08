var qduke = exports;

var config = require('../../config');
var api = require('../../api');
var jade = require('jade');
var fs = require('fs');

qduke.buildAndPush = function (callback) {
	// HTML
    fs.readFile('views/qduke.jade', function (err, data) {
        var html = jade.compile(data)({
            links: config.get('QDUKE_LINKS'),
            ads: config.get('QDUKE_ADS')
        });
        api.s3.put("alpha.qduke.com", html, "/index.html", "text/html", null,  function (s3Err, url) {
        	if (s3Err) {
        		callback(s3Err)
        	}
        });
    });
    // CSS
    fs.readFile('public/styles/qduke.css', function (err, data) {
        api.s3.put("alpha.qduke.com", data, "/qduke.css", "text/html", null,  function (s3Err, url) {
        	if (s3Err) {
        		callback(s3Err)
        	}
        });
    });
    // JS
    fs.readFile('public/scripts/qduke/qduke.js', function (err, data) {
        api.s3.put("alpha.qduke.com", data, "/qduke.js", "text/html", null,  function (s3Err, url) {
        	if (s3Err) {
        		callback(s3Err)
        	}
        });
    });
    callback()
}