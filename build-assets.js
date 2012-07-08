var async = require('async');

var pathutil = require('path');


var _ = require('underscore');

var api = require('./thechronicle_modules/api');
var build = require('./thechronicle_modules/build');
var config = require('./thechronicle_modules/config');
var log = require('./thechronicle_modules/log');

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
            build.init(__dirname);
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
        build.buildAllCSS(function (err, paths) {
            if (err) callback(err);
            else build.pushGeneratedFiles('css', paths, 'text/css', callback);
        });
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




