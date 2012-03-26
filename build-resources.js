var crypto = require('crypto');
var requirejs = require('requirejs');
var fs = require('fs');

var api = require('./thechronicle_modules/api');
var config = require('./thechronicle_modules/config');

exports.buildJavascript = buildJavascript;


function buildJavascript(infile, outfile, callback) {
    var config = { 
        baseUrl: 'public/js',
        name: infile,
        out: 'public/dist/' + outfile,
        paths: {
            jquery: 'require-jquery'
        }
    };
    requirejs.optimize(config, function (buildResponse) {
        fs.readFile(config.out, 'utf8', function (err, data) {
            if (err) callback(err);
            else {
                storeS3(data.toString() + " ", callback);
                fs.unlink(config.out);
            }
        });
    });
}

function storeS3(data, callback) {
    var bucket = config.get('S3_STATIC_BUCKET');
    var md5sum = crypto.createHash('md5');
    md5sum.update(data);
    var path = '/dist/' + md5sum.digest('hex');
    api.s3.put(bucket, data, path, "text/plain", function (err) {
        callback(err, path);
    });
}
