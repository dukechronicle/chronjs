/* require npm nodejs modules */
var asereje = require('asereje');
var async = require('async');
var express = require('express');
require('express-namespace');
var stylus = require('stylus');
var sprintf = require('sprintf').sprintf;
var fs = require('fs');
var net = require('net');
var repl = require('repl');

/* require internal modules */
var globalFunctions = require('./thechronicle_modules/global-functions');
var config = require('./thechronicle_modules/config');
var api = require('./thechronicle_modules/api');
var log = require('./thechronicle_modules/log');
var site = require('./thechronicle_modules/api/lib/site');
var admin = require('./thechronicle_modules/admin/lib/admin');
var mobileapi = require('./thechronicle_modules/mobileapi/lib/mobileapi');
var redisClient = require('./thechronicle_modules/redisclient');
var RedisStore = require('connect-redis')(express);
/*
net.createServer(function (socket) {
  repl.start("node via TCP socket> ", socket);
}).listen(5001);*/

asereje.config({
      active: process.env.NODE_ENV === 'production'        // enable it just for production
    , js_globals: ['typekit', 'underscore-min', 'jquery']   // js files that will be present always
    , css_globals: ['css/reset', 'css/search-webkit', 'style']                     // css files that will be present always
    , js_path: __dirname + '/public/js'           // javascript folder path
    , css_path: __dirname + '/public'                  // css folder path
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
    app.use(express.bodyParser({uploadDir: tmpDirectory()}));
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

app.error(function(err, req, res) {
	try {
		res.send(500);
	}
	catch(err) {}
	globalFunctions.log('ERROR: ' + err.stack);
});


site.assignPreInitFunctionality(app, this);

app.listen(port);
console.log("Server listening on port %d in %s mode", app.address().port, app.settings.env); 

config.init(function(err) {
    if(err) log.crit(err);
    else {
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
    }
});


exports.runSite = function(callback) {
	runSite(callback);
};

function runSite(callback) {
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
                site.init(app, callback);
            },
            function(callback) {
                admin.init(app, callback);
            },
            function(callback) {
                mobileapi.init(app, callback);
            }
        ], function(err) {
            if (err) return log.crit(err);
            return callback();
        })
    });
}

function tmpDirectory() {
    var tmpDir = __dirname + '/tmp';
    try {
	fs.mkdirSync(tmpDir, "0755")
    }
    catch (err) {
	// directory already exists
    }
    return tmpDir;
}
