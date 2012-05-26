/* require npm nodejs modules */
var async = require('async');
var express = require('express');
require('express-namespace');
var RedisStore = require('connect-redis')(express);
var stylus = require('stylus');
var sprintf = require('sprintf').sprintf;

/* require internal modules */
var api = require('./thechronicle_modules/api');
var builder = require('./build-assets');
var config = require('./thechronicle_modules/config');
var log = require('./thechronicle_modules/log');
var redisClient = require('./thechronicle_modules/redisclient');
var route = require('./thechronicle_modules/route');
var sitemap = require('./thechronicle_modules/sitemap');
var util = require('./thechronicle_modules/util');

// Heroku requires the use of process.env.PORT to dynamically configure port
var PORT = process.env.PORT || process.env.CHRONICLE_PORT || 4000;
var SECRET = "i'll make you my dirty little secret";
var SERVER = this;

var app = null;
var viewOptions = {
    isProduction: process.env.NODE_ENV === 'production',
    static_cdn: '',
    currentDate: function () {
        return util.formatTimestamp(util.unixTimestamp(),"dddd, mmmm dS, yyyy");
    }
};

log.init(function (err) {
    if (err) console.err("Logger couldn't be initialized: " + err);
    config.init(runSite, function (err) {
        if (err) log.crit(err);

        var sessionInfo = {
            secret:SECRET,
            cookie:{ maxAge:1800000} // 30 minutes
        };
        redisClient.init(false, function (err) {
            if (err) {
                log.warning('Redis server not defined. Using memory store for sessions instead.');
                log.warning('After defining the configuration info for redis, please restart the server so redis will be used as the session store.');
            }
            else {
                sessionInfo.store = new RedisStore({
                    host:redisClient.getHostname(),
                    port:redisClient.getPort(),
                    pass:redisClient.getPassword(),
                });
            }

            builder.buildAssets(function(err, paths) {
                if (err) log.warning('Failed to build assets: ' + err);
                else log.notice('Built assets');

                viewOptions.paths = paths;
                configureApp(sessionInfo, PORT);
                route.preinit(app);

                if (!config.isSetUp()) {
                    app.get('/', function(req, res, next) {
                        if (!config.isSetUp()) res.redirect('/config');
                        else next();
                    });
                }
                else {
                    runSite(function (err) {
                        if (err) log.error(err);
                    });
                }
            });
        });
    });
});

function configureApp(sessionInfo, port) {
    /* express configuration */
    app = express.createServer();

    app.error(function (err, req, res, next) {
        log.error(err);
        next(err);
    });

    // the middleware itself does not serve the static
    // css files, so we need to expose them with staticProvider
    // these app.configure calls need to come before app.use(app.router)!

    app.configure('development', function () {
        app.use(stylus.middleware({
            src: 'views',
            dest: 'public',
            force: true,
            compile: function (str, path) {
                return stylus(str)
                    .set('filename', path)
                    .set('compress', true)
                    .set('include css', true);
            }
        }));
        app.use(express.static(__dirname + '/public'));
        app.error(express.errorHandler({ dumpExceptions:true, showStack:true }));
    });

    app.configure('production', function () {
        var oneYear = 31557600000;
        app.use(express.static(__dirname + '/public', {maxAge:oneYear}));

        app.error(function (err, req, res, next) {
            var errOptions = {};
            if (api.accounts.isAdmin(req)) errOptions = {dumpExceptions:true, showStack:true};

            var errHandler = express.errorHandler(errOptions);
            errHandler(err, req, res, next);
        });
    });

    app.configure(function () {
        app.set('view options', viewOptions);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.enable('jsonp callback');
        app.use(express.bodyParser({uploadDir:__dirname + '/uploads'}));
        app.use(express.methodOverride());
        // set up session
        app.use(express.cookieParser());
        app.use(express.session(sessionInfo));
        /* set http cache to 30 minutes by default for each response */
        app.use(function (req, res, next) {
            if (!api.accounts.isAdmin(req)) {
                res.header('Cache-Control', 'public, max-age=1800');
            }
            next();
        });
        app.use(app.router);
    });
    app.listen(port);
}

function runSite(callback) {
    api.init(function (err) {
        if (err) {
            log.crit("api initialization failed");
            log.error(err);
        }
        else {
            if (process.env.NODE_ENV === 'production') {
                sitemap.latestNewsSitemap('/sitemaps/news_sitemap', function (err) {
                    if (err) log.warning("Couldn't build news sitemap: " + err);
                });

                builder.pushAssets(viewOptions.paths, function (err, paths) {
                    if (err) log.warning('Failed to push assets to S3: ' + err);
                    else log.notice('Static content pushed to S3');
                    setViewOption('static_cdn', config.get('CLOUDFRONT_STATIC'));
                    setViewOption('paths', paths);
                });
            }
            
            redisClient.init(true, function(err) {
                route.init(app);
                log.notice(sprintf("Site configured and listening on port %d in %s mode", app.address().port, app.settings.env));
                callback();
            });
        }
    });
}

function setViewOption(key, value) {
    viewOptions[key] = value;
    app.set('view options', viewOptions);
}
