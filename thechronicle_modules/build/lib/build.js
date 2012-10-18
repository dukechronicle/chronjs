var build = exports;

var async = require('async');
var cleanCSS = require('clean-css');
var crypto = require('crypto');
var fs = require('fs');
var gzip = require('gzip');
var pathutil = require('path');
var requirejs = require('requirejs');
var stylus = require('stylus');
var walk = require('walk');
var _ = require('underscore');

var api = require('../../api');
var config = require('../../config');
var log = require('../../log');

var STATIC_BUCKET, STYLE_DIR, PUBLIC_DIR, DIST_DIR;
var JS_SOURCES = ['site', 'admin'];


build.init = function (root) {
    STATIC_BUCKET = config.get('S3_STATIC_BUCKET');
    STYLE_DIR = pathutil.join(root, 'views/styles');
    PUBLIC_DIR = pathutil.join(root, 'public');
    DIST_DIR = pathutil.join(root, 'public/dist');
};

build.pushSourceDirectory = function (dir, callback) {
    var errors = [];
    var walker = walk.walk(dir);

    walker.on('file', function (root, stats, next) {
        var filepath = pathutil.join(root, stats.name);
        build.pushSourceFile(filepath, function (err) {
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
};

build.pushSourceFile = function (filepath, callback) {
    var key = '/' + pathutil.relative(PUBLIC_DIR, filepath);
    var type = getMimeType(pathutil.extname(filepath));
    if (!type) {
        return callback('Cannot determine file type: ' + path);
    }

    fs.readFile(filepath, function (err, data) {
        if (err) return callback(err);
        api.s3.put(STATIC_BUCKET, data, key, type, null, callback);
    });
};

build.pushGeneratedFiles = function (configKey, paths, type, callback) {
    async.forEach(_.keys(paths), function (src, callback) {
        fs.readFile(paths[src], function (err, data) {
            if (err) return callback(err);
            var key = '/' + pathutil.relative(PUBLIC_DIR, paths[src]);
            api.s3.put(STATIC_BUCKET, data, key, type, 'gzip', function (err) {
                if (err) callback(err);
                else {
                    paths[src] = config.get('CLOUDFRONT_STATIC') + key;
                    callback();
                }
            });
        });
    }, function (err) {
        if (err) return callback(err);
        var configPaths = config.get('ASSET_PATHS') || {};
        configPaths[configKey] = _.extend(configPaths[configKey] || {}, paths);
        config.setConfigProfile({'ASSET_PATHS': configPaths}, callback);
    });
};

build.buildAllCSS = function (callback) {
    var paths = {};
    fs.readdir(STYLE_DIR, function (err, files) {
        async.forEachSeries(files, function (file, cb) {
            fs.stat(pathutil.join(STYLE_DIR, file), function (err, stats) {
                if (err) cb(err);
                else if (stats.isDirectory())
                    build.buildCSSFile(file, function (err, path) {
                        paths[file] = path;
                        cb(err);
                    });
                else cb();
            });
        }, function (err) {
            callback(err, paths);
        });
    });
};

build.buildCSSFile = function (path, callback) {
    var filepath = pathutil.join(STYLE_DIR, path, 'main.styl');
    fs.readFile(filepath, 'utf8', function (err, contents) {
        if (err) return callback(err);

        var renderer = stylus(contents.toString())
            .set('filename', filepath)
            .set('compress', true)
            .set('include css', true);
        renderer.render(function(err, data) {
            if (err) return callback(err);
            hashAndCompress(cleanCSS.process(data), callback);
        });
    });
};

build.buildAllJavascript = function (callback) {
    var paths = {};
    async.forEachSeries(JS_SOURCES, function (src, cb) {
        build.buildJavascriptFile(src, function (err, path) {
            paths[src] = path;
            cb(err);
        });
    }, function (err) {
        callback(err, paths);
    });
};

build.buildJavascriptFile = function (src, callback) {
    var config = {
        shim: {
            'lib/backbone': {
                deps: ['jquery', 'lib/underscore'],
                exports: 'Backbone',
            }
        },
        baseUrl: 'public/scripts',
        name: src + '/main',
        out: pathutil.join(DIST_DIR, src + '.js'),
        paths: {
            jquery: 'require-jquery'
        }
    };

    requirejs.optimize(config, function (buildResponse) {
        fs.readFile(config.out, function (err, data) {
            if (err) return callback(err);
            fs.unlink(config.out, function (err) {
                if (err) log.warning("Couldn't delete file: " + config.out);
            });
            hashAndCompress(data.toString(), callback);
        });
    });
};

function hashAndCompress(data, callback) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(data);
    var filepath = pathutil.join(DIST_DIR, md5sum.digest('hex'));

    gzip(data, function (err, buffer) {
        if (err) return callback(err);
        fs.writeFile(filepath, buffer, function (err) {
            callback(err, filepath);
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
