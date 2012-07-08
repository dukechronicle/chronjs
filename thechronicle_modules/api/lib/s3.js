var s3 = exports;

var knox = require('knox');
var _ = require('underscore');
var config = require("../../config");
var log = require('../../log');

var CLOUDFRONT_MAPPING = {};
var S3_URL = "http://s3.amazonaws.com/";


s3.init = function () {
    CLOUDFRONT_MAPPING[config.get("S3_BUCKET")] =
        config.get("CLOUDFRONT_DISTRIBUTION");
    CLOUDFRONT_MAPPING[config.get("S3_STATIC_BUCKET")] =
        config.get("CLOUDFRONT_STATIC");
};

s3.getCloudFrontUrl = function(url) {
    _.each(CLOUDFRONT_MAPPING, function (cloudfront, bucket) {
        url = url.replace(S3_URL + bucket, cloudfront);
    });
    return url;
};

s3.get = function (bucket, key, callback) {
    createClient(bucket).get(key).on('response', function (res) {
        callback(res.statusCode == 200, res);
    }).end();
};

s3.put = function (bucket, buf, key, type, encoding, callback) {
    var options = {
        'Content-Length': buf.length,
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000'
    };
    if (encoding) {
        options['Content-Encoding'] = encoding;
    }

    /*
    var req = createClient(bucket).put(key, options);
    req.on('response', function (res) {
        if (200 == res.statusCode)
            callback(null, S3_URL + bucket + '/' + key);
        else
            callback(res);
    });
    req.end(buf);
    */
    log.debug('putting: ' + key + ' ' + type);
    callback(null, S3_URL + bucket + '/' + key);
};

s3.del = function (bucket, key, callback) {
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
