#!/usr/bin/env node

var async = require('async');
var path = require('path');
var program = require('commander');
var _ = require('underscore');

var api = require('./thechronicle_modules/api');
var build = require('./thechronicle_modules/build');
var config = require('./thechronicle_modules/config');
var log = require('./thechronicle_modules/log');


program
    .command('build')
    .description('Build CSS and/or Javascript from source and push to S3.')
    .option('--css [dir]', 'Build CSS files from stylus. Optionally specify ' +
            'subdirectory of views/styles, otherwise builds all.')
    .option('--js [dir]', 'Build Javascript files from source. Optionally ' +
            'specify "site" or "admin", otherwise builds both.')
    .option('--nopush', 'Only build files without pushing to S3.')
    .action(buildAssets);

program
    .command('push')
    .description('Push source static files (eg. images) to S3.')
    .option('--all', 'Push css/, js/, and img/ directories.')
    .option('--directory <dir>', 'Push all files in given directory.')
    .option('--file <file>', 'Push given file.')
    .action(pushAssets);

program.parse(process.argv);


function init(callback) {
    async.waterfall([
        function (callback) {
            config.init(null, callback);
        },
        function (callback) {
            if (config.isSetUp()) {
                build.init(__dirname);
                api.init(callback);
            }
            else {
                callback("Configuration is not set up. Cannot continue.");
            }
        },
    ], callback);
}

function exit(err) {
    if (err) {
        log.error(err);
        process.exit(1);
    }
    else {
        process.exit();
    }
}

function buildAssets(command) {
    init(function (err) {
        if (err) return exit(err);

        if (command.css && command.js) {
            async.series([
                function (callback) {
                    buildCSS(command.css, command.nopush, callback);
                },
                function (callback) {
                    buildJavascript(command.js, command.push, callback);
                }
            ], exit);
        }
        else if (command.css) {
            buildCSS(command.css, command.nopush, exit);
        }
        else if (command.js) {
            buildJavascript(command.js, command.nopush, exit);
        }
        else {
            exit('Must specify either of --css or --js.');
        }
    });
}

function buildCSS(cssOption, noPush, callback) {
    if (cssOption === true) {
        build.buildAllCSS(function (err, paths) {
            if (err) callback(err);
            else if (noPush) callback();
            else {
                build.pushGeneratedFiles('css', paths, 'text/css', callback);
            }
        });
    }
    else {
        build.buildCSSFile(cssOption, function (err, filepath) {
            if (err) callback(err);
            else if (noPush) callback();
            else {
                var paths = {};
                paths[cssOption] = filepath;
                build.pushGeneratedFiles('css', paths, 'text/css', callback);
            }
        });
    }
}

function buildJavascript(jsOption, noPush, callback) {
    if (jsOption === true) {
        build.buildAllJavascript(function (err, paths) {
            if (err) callback(err);
            else if (noPush) callback();
            else {
                var type = 'application/javascript';
                build.pushGeneratedFiles('js', paths, type, callback);
            }
        });
    }
    else {
        build.buildJavascriptFile(jsOption, function (err, filepath) {
            if (err) callback(err);
            else if (noPush) callback();
            else {
                var paths = {};
                paths[jsOption] = filepath;
                var type = 'application/javascript';
                build.pushGeneratedFiles('js', paths, type, callback);
            }
        });
    }
}

function pushAssets(command) {
    init(function (err) {
        if (err) return exit(err);
        if (command.all) {
            var sourceDirs = ['public/css', 'public/js', 'public/img'];
            async.forEach(sourceDirs, build.pushSourceDirectory, exit);
        }
        else if (command.directory) {
            build.pushSourceDirectory(command.directory, exit);
        }
        else if (command.file) {
            build.pushSourceFile(command.file, exit);
        }
        else {
            exit('Must specify one of --all, --directory, or --file.');
        }
    });
}

/*
    function (callback) {
        build.buildAllCSS(function (err, paths) {
            if (err) callback(err);
            else build.pushGeneratedFiles('css', paths, 'text/css', callback);
        });
    }

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
*/