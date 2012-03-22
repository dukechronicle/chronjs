/* require npm nodejs modules */
var asereje = require('asereje');
var async = require('async');
var crypto = require('crypto');
var express = require('express');
var fs = require('fs');
require('express-namespace');
var RedisStore = require('connect-redis')(express);
var requirejs = require('requirejs');
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
var viewOptions = {};

asereje.config({
    active: process.env.NODE_ENV === 'production',  // enable it just for production
    js_globals: ['typekit', 'underscore-min', 'jquery'],  // js files that will be present always
    css_globals: ['css/reset', 'css/search-webkit', 'style'],  // css files that will be present always
    js_path: __dirname + '/public/js',  // javascript folder path
    css_path: __dirname + '/public'  // css folder path
});

log.init(function (err) {
    if (err) console.err("Logger couldn't be initialized: " + err);
    config.init(runSite, function(err) {
	    if (err) log.crit(err);

        var sessionInfo = {
            secret: SECRET,
            cookie: { maxAge:  1800000} // 30 minutes
        };
        redisClient.init(false, function(err) {
            if (err) {
                log.warning('Redis server not defined. Using memory store for sessions instead.'); 
                log.warning('After defining the configuration info for redis, please restart the server so redis will be used as the session store.');
            }
            else {
                sessionInfo.store = new RedisStore({
                    host: redisClient.getHostname(),
                    port: redisClient.getPort(),
                    pass: redisClient.getPassword(),
                });
            }

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
        app.enable('jsonp callback');
        app.use(express.bodyParser({uploadDir: __dirname + '/uploads'}));
        app.use(express.methodOverride());
        // set up session
        app.use(express.cookieParser());
        app.use(express.session(sessionInfo));
        /* set http cache to 30 minutes by default for each response */
        app.use(function(req,res,next) {
            if(!api.accounts.isAdmin(req)) {
                res.header('Cache-Control', 'public, max-age=1800');
            }
            next();
        });
        app.use(app.router);
    });
    app.listen(port);
}

function runSite(callback) {
    setViewOption('static_cdn', config.get('CLOUDFRONT_STATIC'));
    api.init(function (err) {
        if (err) log.crit("api initialization failed");
        else {
	    if (process.env.NODE_ENV === 'production') {
                sitemap.latestNewsSitemap('public/sitemaps/news_sitemap', function (err) {
		    if (err) log.error("Couldn't build news sitemap: " + err);
	        });
            }
            
            buildJavascript('site/main', 'site-js', function (err, jsFile) {
                if (err) log.warning('Failed to build site Javascipt: ' + err);
                else log.notice('Built site Javascript');
                setViewOption('site_javascript', jsFile);
             });

            buildJavascript('admin/main', 'admin-js', function (err, jsFile) {
                if (err) log.warning('Failed to build admin Javascipt: ' + err);
                else log.notice('Built admin Javascript');
                setViewOption('admin_javascript', jsFile);
             });

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
                var md5sum = crypto.createHash('md5');
                md5sum.update(data.toString());
                var jsFile = '/dist/' + md5sum.digest('hex') + '.js';
                fs.rename(config.out, 'public' + jsFile, function (err) {
                    callback(err, jsFile);
                });
            }
        });
    });
}
