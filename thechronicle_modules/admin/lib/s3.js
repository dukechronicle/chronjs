var s3 = {};
var exports = module.exports = s3;

var knox = require('knox');
var fs = require('fs');
var config = require("../../config");
var log = require('../../log');

var BUCKET_NAME = null;
var KEY = null;
var SECRET = null;

s3.put = function (buf, key, type, callback) {
    _getClientStatic(function (err, client) {
        var req = client.put(key, {
            'Content-Length':buf.length,
            'Content-Type':type
        });
        req.on('response', function (res) {
            if (200 == res.statusCode) callback(null, _getUrl(key));
            else callback(res, null);
        });
        req.end(buf);
    });
};

s3.init = function (callback) {
    BUCKET_NAME = config.get("S3_BUCKET");
    KEY = config.get("S3_KEY");
    SECRET = config.get("S3_SECRET");

    callback(null);
};

function _getUrl(key) {
    return 'http://s3.amazonaws.com/' + BUCKET_NAME + '/' + key;
}

function _getClientStatic(callback) {
    var client = knox.createClient({
           key: KEY,
            secret: SECRET,
            bucket: BUCKET_NAME
     });
     callback(null, client);
}
/*
fs.readFile('README.md', function(err, buf) {
    s3.put(buf, 'README.md', 'text/plain', function(err, res) {
        log.debug(res);
    });
});
*/
