var async = require('async');
var cleanCSS = require('clean-css');
var crypto = require('crypto');
var requirejs = require('requirejs');
var fs = require('fs');
var gzip = require('gzip');
var pathutil = require('path');
var stylus = require('stylus');
var walk = require('walk');
var _ = require('underscore');

var api = require('./thechronicle_modules/api');
var config = require('./thechronicle_modules/config');
var log = require('./thechronicle_modules/log');

var STATIC_BUCKET = null;
var STYLE_DIR = __dirname + '/views/styles/';
var DIST_DIR = __dirname + '/public/dist/';
var PUBLIC_DIR = __dirname + '/public/';
var JS_SOURCES = [ 'site', 'admin' ];


async.waterfall([
    function (callback) {
        config.init(null, callback);
    },
    function (callback) {
        if (config.isSetUp()) {
            STATIC_BUCKET = config.get('S3_STATIC_BUCKET');
            api.init(callback);
        }
        else {
            log.error("Configuration is not set up. Cannot continue.");
        }
    },
    /*
    buildAssets,
    pushAssets,
    function (paths, callback) {
        config.setConfigProfile({'ASSET_PATHS': paths}, callback);
    }
    */
    function (callback) {
        pushSourceDirectory(pathutil.resolve('public/css'), callback);
    }
], function (err) {
    if (err) log.error(err);
    else log.notice('Build was successful');
});

function buildAssets(callback) {
    async.parallel({css: buildCSS, js: buildJavascript}, callback);
}

function pushAssets(paths, callback) {
    async.parallel({
        css: pushAll(paths.css, "text/css"),
        js: pushAll(paths.js, "application/javascript"),
        src: pushSource(['css', 'js', 'img']),
    }, function (err) {
        callback(err, paths);
    });
}

function pushSourceDirectory(dir, callback) {
    var errors = [];
    var walker = walk.walk(dir);

    walker.on('file', function (root, stats, next) {
        var filepath = pathutil.join(root, stats.name);
        log.debug(filepath);
        pushSourceFile(filepath, function (err) {
            if (err) {
                errors.push('Error pushing ' + filepath + ': ' + err);
            }
            next();
        });
    });

    walker.on('end', function () {
        if (errors.length == 0) {
            errors = null;
        }
        callback(errors);
    });
}

function pushSourceFile(filepath, callback) {
    var key = pathutil.relative(PUBLIC_DIR, filepath);
    var type = getMimeType(pathutil.extname(filepath));
    if (!type) {
        return callback('Cannot determine file type: ' + path);
    }

    fs.readFile(filepath, function (err, data) {
        if (err) return callback(err);
        api.s3.put(STATIC_BUCKET, data, key, type, null, callback);
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
    var md5sum = crypto.createHash('md5');
    md5sum.update(data);
    var path = '/dist/' + md5sum.digest('hex');

    gzip(data, function (err, buffer) {
        if (err) return callback(err);
        api.s3.put(STATIC_BUCKET, buffer, path, type, "gzip", function(err) {
            callback(err, config.get('CLOUDFRONT_STATIC') + path);
        });
    });
}

function getMimeType(extension) {
    var extensionToType = {
        '': 'text/plain',
        '.css': 'text/css',
        '.eot': 'application/vnd.ms-fontobject',
        '.gif': 'image/gif',
        '.html': 'text/html',
        '.ico': 'image/x-icon',
        '.jpg': 'image/jpeg',
        '.js': 'application/javascript',
        '.otf': 'application/octet-stream',
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ttf': 'application/octet-stream',
        '.woff': 'application/font-woff',
    }
    return extensionToType[extension];
}
