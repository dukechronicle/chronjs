var qduke = exports;

var config = require('../../config');
var api = require('../../api');
var jade = require('jade');
var fs = require('fs');

var s3_bucket = "www.qduke.com";

qduke.buildAndPush = function (callback) {
    // HTML
    fs.readFile('views/qduke/qduke.jade', function (err, data) {
        var html = jade.compile(data, { filename: 'views/qduke/qduke.jade' })({
            links: config.get('QDUKE_LINKS')
        });
        api.s3.put(s3_bucket, html, "/index.html", "text/html", null,  function (s3Err, url) {
            if (s3Err) {
                callback(s3Err)
            }
        }, "no-cache");
    });
    // CSS
    fs.readFile('public/styles/qduke/main.css', function (err, data) {
        api.s3.put(s3_bucket, data, "/styles/qduke/main.css", "text/css", null,  function (s3Err, url) {
            if (s3Err) {
                callback(s3Err)
            }
        }, "no-cache");
    });
    // JS
    fs.readFile('public/scripts/qduke/qduke.js', function (err, data) {
        api.s3.put(s3_bucket, data, "/scripts/qduke/qduke.js", "application/x-javascript", null,  function (s3Err, url) {
            if (s3Err) {
                callback(s3Err)
            }
        }, "no-cache");
    });
    // Img
    fs.readFile('public/img/qduke/loading.gif', function (err, data) {
        api.s3.put(s3_bucket, data, "/img/qduke/loading.gif", "image/gif", null,  function (s3Err, url) {
            if (s3Err) {
                callback(s3Err)
            }
        });
    });
    fs.readFile('public/img/qduke/search.gif', function (err, data) {
        api.s3.put(s3_bucket, data, "/img/qduke/search.gif", "image/gif", null,  function (s3Err, url) {
            if (s3Err) {
                callback(s3Err)
            }
        });
    });
    fs.readFile('public/img/qduke/default_image.jpg', function (err, data) {
        api.s3.put(s3_bucket, data, "/img/qduke/default_image.jpg", "image/gif", null,  function (s3Err, url) {
            if (s3Err) {
                callback(s3Err)
            }
        });
    });
    fs.readFile('public/img/qduke/newwindow.png', function (err, data) {
        api.s3.put(s3_bucket, data, "/img/qduke/newwindow.png", "image/gif", null,  function (s3Err, url) {
            if (s3Err) {
                callback(s3Err)
            }
        });
    });
    callback()
}