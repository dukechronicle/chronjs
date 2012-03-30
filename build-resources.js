var async = require('async');
var crypto = require('crypto');
var requirejs = require('requirejs');
var fs = require('fs');
var gzip = require('gzip');
var sqwish = require('sqwish');
var stylus = require('stylus');
var walk = require('walk');

var api = require('./thechronicle_modules/api');
var config = require('./thechronicle_modules/config');
var log = require('./thechronicle_modules/log');

var STYLE_DIR = __dirname + '/views/styles/';
var DIST_DIR = __dirname + '/public/dist/';

exports.buildJavascript = buildJavascript;
exports.buildCSS = buildCSS;


function buildCSS(callback) {
    fs.readdir(STYLE_DIR, function (err, files) {
        async.forEachSeries(files, function (file, cb) {
            fs.stat(STYLE_DIR + file, function (err, stats) {
                if (err) cb(err);
                else if (!stats.isDirectory()) cb();
                else buildCSSFile(file, cb);
            });
        }, function (err) {
            if (err) callback(err);
            else callback();
        });
    });
}

function buildCSSFile(path, callback) {
    var style = "";

    var options = {
        styl: function (data, path, callback) {
            stylus(data).set('compress', true).set('filename', path)
                .render(callback);
        },
        css: function (data, path, callback) { callback(null, data) }
    };

    var walker = walk.walk(STYLE_DIR + path);
    
    walker.on('file', function (name, stats, next) {
        var extension = stats.name.match(/\.([a-z]+)$/);
        if (extension && extension[1] in options) {
            var compile = options[extension[1]];
            var filepath = name + '/' + stats.name;
            fs.readFile(filepath, function (err, contents) {
                if (err) callback(err);
                else compile(contents.toString(), filepath, function(err, data) {
                    if (err) {
                        log.error(err);
                        next(err);
                    }
                    else {
                        style += sqwish.minify(data, true);
                        next();
                    }
                });
            });
        }
        else next();
    });
    
    walker.on('end', function (err) {
        if (err) callback(err);
        else fs.writeFile(DIST_DIR + path + '.css', style, callback);
    });
}

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
                storeS3(data.toString(), callback);
                fs.unlink(config.out);
            }
        });
    });
}

function storeS3(data, callback) {
    var bucket = config.get('S3_STATIC_BUCKET');

    var md5sum = crypto.createHash('md5');
    md5sum.update(data);
    var path = '/dist/' + md5sum.digest('hex') + '2';

    gzip(data, function (err, buffer) {
        if (err) callback(err);
        else {
            api.s3.put(bucket, buffer, path, "text/plain", "gzip", function(err){
                callback(err, path);
            });
        }
    });
}
