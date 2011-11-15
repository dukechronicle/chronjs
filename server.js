/* require npm nodejs modules */
var express = require('express');
require('express-namespace');
var stylus = require('stylus');
var sprintf = require('sprintf').sprintf;


/* require internal modules */
var globalFunctions = require('./thechronicle_modules/global-functions');
var config = require('./thechronicle_modules/config');
var cron = require('./thechronicle_modules/api/lib/cron');
var api = require('./thechronicle_modules/api/lib/api');
var log = require('./thechronicle_modules/log');
var site = require('./thechronicle_modules/api/lib/site');
var admin = require('./thechronicle_modules/admin/lib/admin');
var mobileapi = require('./thechronicle_modules/mobileapi/lib/mobileapi');
var redisClient = require('./thechronicle_modules/api/lib/redisclient');
var RedisStore = require('connect-redis')(express);

var async = require('async');

var asereje = require('asereje');
asereje.config({
  active: process.env.NODE_ENV === 'production'        // enable it just for production
, js_globals: ['typekit', 'underscore-min', 'jquery']   // js files that will be present always
, css_globals: ['css/reset', 'css/search-webkit', 'style']                     // css files that will be present always
, js_path: __dirname + '/public/js'           // javascript folder path
, css_path: __dirname + '/public'                  // css folder path
});


/* express configuration */
var app = express.createServer();

var port = 4000;
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

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    // set up session
    app.use(express.cookieParser());
    app.use(express.session({ secret: SECRET }));
    /* set http cache to one minute by default for each response */
    app.use(function(req,res,next){
        if(!api.accounts.isAdmin(req)) {
            res.header('Cache-Control', 'public, max-age=60');
        }
        next();
    });
    app.use(app.router);

});

// the middleware itself does not serve the static
// css files, so we need to expose them with staticProvider

app.configure('development', function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    var oneYear = 31557600000;
    app.use(express.static(__dirname + '/public', {maxAge: oneYear}));
    app.use(express.errorHandler());
});


app.error(function(err, req, res, next) {
	try {
		res.send(500);
	}
	catch(err) {}
	globalFunctions.log('ERROR: ' + err.stack);
});


site.assignPreInitFunctionality(app,this);

app.listen(process.env.PORT || port);
console.log("Server listening on port %d in %s mode", app.address().port, app.settings.env); 


if(!config.isSetUp()) {
	app.get('/', function(req, res, next) {
		if(!config.isSetUp()) {
			res.redirect('/config');
		}		
		else next();
	});
} else {
    runSite(function() {});
}

exports.runSite = function(callback)
{	
	runSite(callback);
}

function runSite(callback) {
	port = config.get('SERVER_PORT');
	
	cron.init();	
	log.init();

    log.notice(sprintf("Site configured and listening on port %d in %s mode", app.address().port, app.settings.env));      
	
    // use redis as our session store
    redisClient.init(function (err0) {
        if(err0) return log.error(err0);
        app.use(express.session({
            secret: SECRET,
            store: new RedisStore({
                host:redisClient.getHostname(),
                port:redisClient.getPort(),
                pass:redisClient.getPassword()
            })
        }));

        // initialize all routes
        async.parallel([
            function(callback) {
                site.init(app, function(err) {
                    if (err) return log.crit(err);
                });
            },
            function(callback) {
                admin.init(app, function(err) {
                     if (err) return log.crit(err);
                });
            },
            function(callback) {
                mobileapi.init(app, function(err) {
                    if (err) return log.crit(err);
                });
            }
        ], function(err, res) {      
            return callback();
        })
    });
}
