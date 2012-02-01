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
var site = require('./thechronicle_modules/api/lib/site');
var sitemap = require('./thechronicle_modules/sitemap');


asereje.config({
    active: process.env.NODE_ENV === 'production',  // enable it just for production
    js_globals: ['typekit', 'underscore-min', 'jquery'],  // js files that will be present always
    css_globals: ['css/reset', 'css/search-webkit', 'style'],  // css files that will be present always
    js_path: __dirname + '/public/js',  // javascript folder path
    css_path: __dirname + '/public'  // css folder path
});


/* express configuration */
var app = express.createServer();

// Heroku requires the use of process.env.PORT to dynamically configure port
var port = process.env.PORT || process.env.CHRONICLE_PORT || 4000;
var SECRET = "i'll make you my dirty little secret";

function compile(str, path) {
  return stylus(str)
	.set('filename', path)
	.set('compress', true);
}

// add the stylus middleware, which re-compiles when
// a stylesheet has changed, compiling FROM src,
// TO dest. dest is optional, defaulting to src
app.use(stylus.middleware({
    src: __dirname + '/views'
  , dest: __dirname + '/public'
  , compile: compile
  , firebug: true
}));

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
    app.use(express.cookieParser());
    app.use(express.session({ secret: SECRET }));
    // set http cache to one minute by default for each response
    app.use(function(req,res,next){
        if (api.accounts.isAdmin(req))
            res.header('Cache-Control', 'public, max-age=60');
        next();
    });
    app.use(app.router);
});

app.error(function(err, req, res, next) {
    log.error(err);
    next(err);
});

log.init(function (err) {
    if (err) console.err("Logger couldn't be initialized: " + err);

    app.listen(port);
    log.notice(sprintf("Site configured and listening on port %d in %s mode",
                       app.address().port, app.settings.env));
    route.assignPreInitFunctionality(app, runSite);
    config.init(function(err) {
	if(err) log.crit(err);
	else if (!config.isSetUp())
	    app.get('/', function(req, res, next) {
		if (!config.isSetUp()) res.redirect('/config');
		else next();
	    });
	else
	    runSite(function (err) {
		if (err) log.error(err);
	    });
    });
});

function runSite(callback) {
    // use redis as our session store
    redisClient.init(function (err) {
        if (err) log.error(err);
	else app.use(express.session({
	    secret: SECRET,
	    store: new RedisStore({
                host:redisClient.getHostname(),
                port:redisClient.getPort(),
                pass:redisClient.getPassword()
	    })
        }));
        
        api.init(function (err) {
            if (err) log.crit("api init failed!");
            else {
                sitemap.latestNewsSitemap('public/sitemaps/news_sitemap', function (err) {
                    if (err) log.warning("Couldn't build news sitemap: " + err);
                });
                site.init();

                // initialize all routes
                route.init(app, callback);
            }
        });
    });
}
