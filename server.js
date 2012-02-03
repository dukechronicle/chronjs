/* require npm nodejs modules */
var asereje = require('asereje');
var async = require('async');
var express = require('express');
require('express-namespace');
var RedisStore = require('connect-redis')(express);
var stylus = require('stylus');
var sprintf = require('sprintf').sprintf;

/* require internal modules */
var api = require('./thechronicle_modules/api');
var config = require('./thechronicle_modules/config');
var log = require('./thechronicle_modules/log');
var redisClient = require('./thechronicle_modules/redisclient');
var route = require('./thechronicle_modules/route');
var sitemap = require('./thechronicle_modules/sitemap');


// Heroku requires the use of process.env.PORT to dynamically configure port
var PORT = process.env.PORT || process.env.CHRONICLE_PORT || 4000;
var SECRET = "i'll make you my dirty little secret";
var SERVER = this;

var app = null;


asereje.config({
    active: process.env.NODE_ENV === 'production',  // enable it just for production
    js_globals: ['typekit', 'underscore-min', 'jquery'],  // js files that will be present always
    css_globals: ['css/reset', 'css/search-webkit', 'style'],  // css files that will be present always
    js_path: __dirname + '/public/js',  // javascript folder path
    css_path: __dirname + '/public'  // css folder path
});

log.init(function (err) {
    if (err) console.err("Logger couldn't be initialized: " + err);
    config.init(function(err) {
	if (err) log.crit(err);

        var sessionInfo = {
            secret: SECRET,
        };
        redisClient.init(function(err) {
            if (err) {
                log.warning('Redis server not defined. Using memory store for sessions instead.'); 
                log.warning('After defining the configuration info for redis, please restart the server so redis will be used as the session store.');
            }
            else {
                sessionInfo.store = new RedisStore({
                    client: redisClient.client
                });
            }

            configureApp(sessionInfo, PORT);
            route.preinit(app, runSite);
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

function compile(str, path) {
  return stylus(str)
	.set('filename', path)
	.set('compress', true);
}

function configureApp(sessionInfo, port) {
    /* express configuration */
    app = express.createServer();

    // add the stylus middleware, which re-compiles when
    // a stylesheet has changed, compiling FROM src,
    // TO dest. dest is optional, defaulting to src
    app.use(stylus.middleware({
        src: __dirname + '/views'
      , dest: __dirname + '/public'
      , compile: compile
      , firebug: true
    }));

    app.error(function(err, req, res, next) {
        log.error(err);
        next(err);
    });

    // the middleware itself does not serve the static
    // css files, so we need to expose them with staticProvider
    // these app.configure calls need to come before app.use(app.router)!

    app.configure('development', function() {
        app.use(express.static(__dirname + '/public'));
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function(){
        var oneYear = 31557600000;
        app.use(express.static(__dirname + '/public', {maxAge: oneYear}));
        app.use(express.errorHandler());
    });

    app.configure(function() {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.use(express.bodyParser({uploadDir: __dirname + '/uploads'}));
        app.use(express.methodOverride());
        // set up session
        app.use(express.cookieParser());
        app.use(express.session(sessionInfo));
        /* set http cache to one minute by default for each response */
        app.use(function(req,res,next) {
            if(!api.accounts.isAdmin(req)) {
                res.header('Cache-Control', 'public, max-age=300');
            }
            next();
        });
        app.use(app.router);
    });

    app.listen(port);
}

function runSite(callback) {
    route.init(app, function (err) {
        log.notice(sprintf("Site configured and listening on port %d in %s mode",
                           app.address().port, app.settings.env));
    });
}
