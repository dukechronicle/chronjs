var async = require('async');
var express = require('express');
require('express-namespace');
var RedisStore = require('connect-redis')(express);
var stylus = require('stylus');

var api = require('./thechronicle_modules/api');
var builder = require('./build-assets');
var config = require('./thechronicle_modules/config');
var log = require('./thechronicle_modules/log');
var redisClient = require('./thechronicle_modules/redisclient');
var route = require('./thechronicle_modules/route');
var util = require('./thechronicle_modules/util');

// Heroku requires the use of process.env.PORT to dynamically configure port
var PORT = process.env.PORT || process.env.CHRONICLE_PORT || 4000;
var SECRET = "i'll make you my dirty little secret";

var app, viewOptions, viewHelpers, sessionManager;


log.init();
config.init(runSite, function (err) {
    if (err) return log.error("Configuration failed: " + err);

    viewOptions = {
        staticCdn: '',
        useCompiledStaticFiles: false,
        isProduction: process.env.NODE_ENV === 'production'
    };

    viewHelpers = {

    };

    sessionManager = new SessionManager();

    configureApp();
    route.preinit(app);

    if (config.isSetUp()) {
        runSite(function (err) {
            if (err) log.error(err);
        });
    }
});

function configureApp() {
    /* express configuration */
    app = express.createServer();

    app.error(function (err, req, res, next) {
        if (err.message == 'URI malformed')
            log.error(err.message + ": " + req.url);
        else log.error(err.stack || err);
        next(err);
    });

    // the middleware itself does not serve the static
    // css files, so we need to expose them with staticProvider
    // these app.configure calls need to come before app.use(app.router)!
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

    app.configure('development', function () {
        app.use(express.static(__dirname + '/public'));
        app.error(express.errorHandler({ showStack:true }));
    });

    app.configure('production', function () {
        var oneYear = 31557600000;
        app.use(express.static(__dirname + '/public', {maxAge:oneYear}));

        app.error(function (err, req, res, next) {
            var errOptions = api.accounts.isAdmin(req) ?
                { showStack:true } : {};
            var errHandler = express.errorHandler(errOptions);
            errHandler(err, req, res, next);
        });
    });

    app.configure(function () {
        app.helpers(viewHelpers);
        app.set('view options', viewOptions);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.enable('jsonp callback');
        app.use(express.bodyParser({uploadDir:__dirname + '/uploads'}));
        app.use(express.methodOverride());

        // set up session
        app.use(express.cookieParser());
        app.use(sessionManager.session);

        // set http cache to 30 minutes by default for each response
        app.use(function (req, res, next) {
            if (!api.accounts.isAdmin(req)) {
                res.header('Cache-Control', 'public, max-age=1800');
            }
            next();
        });

        app.use(app.router);
    });
    app.listen(PORT);
}

function runSite(callback) {
    if (process.env.NODE_ENV === 'production') {
        log.writeToLoggly();
    }
    
    async.waterfall([
        api.init,
        redisClient.init
    ], function (err) {
        if (err) {
            log.error(err);
            app.close();
            return
        }

        if (process.env.NODE_ENV === 'production') {
            builder.buildAssets(function(err, paths) {
                if (err) log.warning('Failed to build assets: ' + err);
                else log.notice('Built assets');

                viewOptions.paths =  paths;
                viewOptions.staticCdn = config.get('CLOUDFRONT_STATIC');
                viewOptions.useCompiledStaticFiles = true;
                app.set('view options', viewOptions);
            });
        }

        sessionManager.useRedisStore(redisClient.getHostname(),
                                     redisClient.getPort(),
                                     redisClient.getPassword());

        route.init(app);
        log.notice(util.format("Site configured and listening on port %d in %s mode",
                               app.address().port, app.settings.env));
        
        if (callback) callback();
    });
}

/**
 * Wraps express session middleware in a way such that the underlying
 * session store can be changed dynamically from MemoryStore to RedisStore.
 * This class encapsulates all session options.
 */
function SessionManager() {
    var self = this;

    this.sessionInfo = {
        secret: SECRET,
        cookie: { maxAge: 1800000 } // Expire after 30 minutes
    };
    this.expressSession = express.session(this.sessionInfo);

    this.useRedisStore = function (host, port, password) {
        self.sessionInfo.store = new RedisStore({
            host: host,
            port: port,
            pass: password
        });
        self.expressSession = express.session(self.sessionInfo);
    };

    this.session = function (req, res, next) {
        self.expressSession(req, res, next);
    };
}


