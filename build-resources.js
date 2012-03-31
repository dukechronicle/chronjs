var async = require('async');
var cleanCSS = require('clean-css');
var crypto = require('crypto');
var requirejs = require('requirejs');
var fs = require('fs');
var gzip = require('gzip');
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
    var paths = {};
    fs.readdir(STYLE_DIR, function (err, files) {
        async.forEachSeries(files, function (file, cb) {
            fs.stat(STYLE_DIR + file, function (err, stats) {
                if (err) cb(err);
                else if (!stats.isDirectory()) cb();
                else buildCSSFile(file, function (err, path) {
                    paths[file] = path;
                    cb(err);
                });
            });
        }, function (err) {
            callback(err, paths);
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
                        style += cleanCSS.process(data);
                        next();
                    }
                });
            });
        }
        else next();
    });
    
    walker.on('end', function (err) {
        if (err) callback(err);
        else if (true) //process.env.NODE_ENV == 'production')
            storeS3(style, "text/css", function (err, name) {
                if (err) callback(err);
                else callback(null, config.get('CLOUDFRONT_STATIC') + name);
            });
        else
            fs.writeFile(DIST_DIR + path + '.css', style, function (err) {
                callback(err, '/dist/' + path + '.css');
            });
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
                storeS3(data.toString(), "application/javascript", callback);
                fs.unlink(config.out);
            }
        });
    });
}

function storeS3(data, type, callback) {
    var bucket = config.get('S3_STATIC_BUCKET');

    var md5sum = crypto.createHash('md5');
    md5sum.update(data);
    var path = '/dist/1' + md5sum.digest('hex');

    api.s3.get(bucket, path, function (err, res) {
        log.debug(res);
//        if (res.statusCode == 200 && false)
//            callback(null, path);
        gzip(data, function (err, buffer) {
            if (err) callback(err);
            else {
                api.s3.put(bucket, buffer, path, type, "gzip", function(err) {
                    callback(err, path);
                });
            }
        });
    });
}
