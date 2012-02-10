var s3 = {};
var exports = module.exports = s3;

var knox = require('knox');
var fs = require('fs');
var config = require("../../config");
var log = require('../../log');

var BUCKET_NAME = null;
var KEY = null;
var SECRET = null;
var S3_URL = "http://s3.amazonaws.com/";
var CLOUDFRONT_DISTRIBUTION = null;

s3.put = function (buf, key, type, callback) {
    _getClientStatic(function (err, client) {
        var req = client.put(key, {
            'Content-Length':buf.length,
            'Content-Type':type,
            'Cache-Control': 'public, max-age=86400'
        });
        req.on('response', function (res) {
            if (200 == res.statusCode) callback(null, _getUrl(key));
            else callback(res, null);
        });
        req.end(buf);
    });
};

s3.delete = function (key, callback) {
    if(key.indexOf(BUCKET_NAME) != -1) {
         key = key.replace('/'+BUCKET_NAME+'/','');
    }

    _getClientStatic(function(err, client) {
        client.deleteFile(key, callback);
    });
};

s3.init = function () {
    BUCKET_NAME = config.get("S3_BUCKET");
    KEY = config.get("S3_KEY");
    SECRET = config.get("S3_SECRET");
    CLOUDFRONT_DISTRIBUTION = config.get("CLOUDFRONT_DISTRIBUTION");
};

s3.getCloudFrontUrl = function(url) {
    return url.replace(S3_URL + BUCKET_NAME, CLOUDFRONT_DISTRIBUTION);
};

function _getUrl(key) {
    return S3_URL + BUCKET_NAME + '/' + key;
}

function _getClientStatic(callback) {
    var client = knox.createClient({
           key: KEY,
            secret: SECRET,
            bucket: BUCKET_NAME
     });
     callback(null, client);
}
