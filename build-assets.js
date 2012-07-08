var async = require('async');
var cleanCSS = require('clean-css');
var crypto = require('crypto');
var requirejs = require('requirejs');
var fs = require('fs');
var gzip = require('gzip');
var stylus = require('stylus');
var _ = require('underscore');

var api = require('./thechronicle_modules/api');
var config = require('./thechronicle_modules/config');
var log = require('./thechronicle_modules/log');

var STYLE_DIR = __dirname + '/views/styles/';
var DIST_DIR = __dirname + '/public/dist/';
var JS_SOURCES = [ 'site', 'admin' ];


config.init(null, function (err) {
    if (err)
        log.error("Configuration failed: " + err);
    else if (!config.isSetUp())
        log.error("Configuration is not set up. Cannot continue.");
    else {
        api.init(function (err) {
            if (err) log.error("API init failed: " + err);
            else {
                buildAssets(function (err, paths) {
                    if (err) log.error(err);
                    else log.debug(JSON.stringify(paths));
                });
            }
        });
    }
});

function buildAssets(callback) {
    async.parallel({css: buildCSS, js: buildJavascript}, function (err, paths) {
        if (err) callback(err);
        else pushAssets(paths, callback);
    });
}

function pushAssets(paths, callback) {
    async.parallel({
        css: pushAll(paths.css, "text/css"),
        js: pushAll(paths.js, "application/javascript")
    }, function (err) {
        callback(err, paths);
    });
}

function pushAll(paths, type) {
    return function (callback) {
        async.forEach(_.keys(paths), function (src, callback) {
            fs.readFile('public' + paths[src], 'utf8', function (err, data) {
                if (err) callback(err);
                else {
                    storeS3(data.toString(), type, function (err, path) {
                        if (err) callback(err);
                        else {
                            paths[src] = path;
                            callback();
                        }
                    });
                }
            });
        }, callback);
    };
}

function buildCSS(callback) {
    var paths = {};
    fs.readdir(STYLE_DIR, function (err, files) {
        async.forEachSeries(files, function (file, cb) {
            fs.stat(STYLE_DIR + file, function (err, stats) {
                if (err) cb(err);
                else if (stats.isDirectory())
                    buildCSSFile(file, function (err, path) {
                        paths[file] = path;
                        cb(err);
                    });
                else cb();
            });
        }, function (err) {
            callback(err, paths);
        });
    });
}

function buildCSSFile(path, callback) {
    var filepath = STYLE_DIR + path + '/main.styl';
    fs.readFile(filepath, function (err, contents) {
        if (err) return callback(err);

        var renderer = stylus(contents.toString())
            .set('filename', filepath)
            .set('compress', true)
            .set('include css', true);
        renderer.render(function(err, data) {
            if (err) {
                log.error(err);
                return callback(err);
            }
            
            var style = cleanCSS.process(data);
            fs.writeFile(DIST_DIR + path + '.css', style, function (err) {
                callback(err, '/dist/' + path + '.css');
            });
        });
    });
}

function buildJavascript(callback) {
    var paths = {};
    async.forEachSeries(JS_SOURCES, function (src, cb) {
        buildJavascriptFile(src, function (err, path) {
            paths[src] = path;
            cb(err);
        });
    }, function (err) {
        callback(err, paths);
    });
}

function buildJavascriptFile(src, callback) {
    var config = { 
        baseUrl: 'public/scripts',
        name: src + '/main',
        out: 'public/dist/' + src + '.js',
        paths: {
            jquery: 'require-jquery'
        }
    };

    requirejs.optimize(config, function (buildResponse) {
        callback(null, '/dist/' + src + '.js');
    });
}

function storeS3(data, type, callback) {
    var bucket = config.get('S3_STATIC_BUCKET');

    var md5sum = crypto.createHash('md5');
    md5sum.update(data);
    var path = '/dist/' + md5sum.digest('hex');

    gzip(data, function (err, buffer) {
        if (err) callback(err);
        else {
            api.s3.put(bucket, buffer, path, type, "gzip", function(err) {
                callback(err, config.get('CLOUDFRONT_STATIC') + path);
            });
        }
    });
}
