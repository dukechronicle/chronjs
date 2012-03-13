var s3 = exports;

var knox = require('knox');
var config = require("../../config");
var log = require('../../log');

var BUCKET_NAME, STATIC_BUCKET_NAME, CLOUDFRONT_DISTRIBUTION;
var S3_URL = "http://s3.amazonaws.com/";


s3.init = function () {
    BUCKET_NAME = config.get("S3_BUCKET");
    STATIC_BUCKET_NAME = config.get("S3_STATIC_BUCKET");
    CLOUDFRONT_DISTRIBUTION = config.get("CLOUDFRONT_DISTRIBUTION");
};

s3.put = function (buf, key, type, callback) {
    put(BUCKET_NAME, buf, key, type, callback);
};

s3.delete = function (key, callback) {
    key = key.replace('/'+BUCKET_NAME+'/','');
    del(BUCKET_NAME, key, callback);
};

s3.getCloudFrontUrl = function(url) {
    return url.replace(S3_URL + BUCKET_NAME, CLOUDFRONT_DISTRIBUTION);
};

function put(bucket, buf, key, type, callback) {
    var req = createClient(bucket).put(key, {
        'Content-Length':buf.length,
        'Content-Type':type,
        'Cache-Control': 'public, max-age=86400'
    });
    req.on('response', function (res) {
        if (200 == res.statusCode)
            callback(null, S3_URL + bucket + '/' + key);
        else
            callback(res);
    });
    req.end(buf);
}

function del(bucket, key, callback) {
    createClient(bucket).deleteFile(key, callback);
};

function createClient(bucket) {
    return knox.createClient({
        key: config.get("S3_KEY"),
        secret: config.get("S3_SECRET"),
        bucket: bucket
    });
}
