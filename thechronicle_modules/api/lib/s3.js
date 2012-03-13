var s3 = exports;

var knox = require('knox');
var config = require("../../config");
var log = require('../../log');

var BUCKET_NAME, CLOUDFRONT_DISTRIBUTION;
var S3_URL = "http://s3.amazonaws.com/";


s3.init = function () {
    BUCKET_NAME = config.get("S3_BUCKET");
    CLOUDFRONT_DISTRIBUTION = config.get("CLOUDFRONT_DISTRIBUTION");
};

/**
  For backwards compatibility, put function parameters are:
    s3.put([bucket, ]buffer, key, type, callback)
  If bucket is not given, it defaults to S3_BUCKET configuration parameter.
*/
s3.put = function () {
    // convert arguments object to array
    var args = Array.prototype.slice.call(arguments);

    if (args.length == 4)
        args.unshift(BUCKET_NAME);
    if (args.length == 5)
        put.apply(this, args);
    else
        log.error("Unknown argument types to s3.put");
};

/**
  For backwards compatibility, put function parameters are:
    s3.delete([bucket, ]buffer, key, type, callback)
  If bucket is not given, it defaults to S3_BUCKET configuration parameter.
*/
s3.delete = function () {
    // convert arguments object to array
    var args = Array.prototype.slice.call(arguments);

    if (args.length == 2)
        args.unshift(BUCKET_NAME);
    if (args.length == 3)
        del.apply(this, args);
    else
        log.error("Unknown argument types to s3.delete");
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
};

function del(bucket, key, callback) {
    key = key.replace('/'+bucket+'/','');
    createClient(bucket).deleteFile(key, callback);
};

function createClient(bucket) {
    return knox.createClient({
        key: config.get("S3_KEY"),
        secret: config.get("S3_SECRET"),
        bucket: bucket
    });
}
