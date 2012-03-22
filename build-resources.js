var crypto = require('crypto');
var requirejs = require('requirejs');
var fs = require('fs');

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
                var md5sum = crypto.createHash('md5');
                md5sum.update(data.toString());
                var jsFile = '/dist/' + md5sum.digest('hex') + '.js';
                fs.rename(config.out, 'public' + jsFile, function (err) {
                    callback(err, jsFile);
                });
            }
        });
    });
}
