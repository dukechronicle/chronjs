/* require npm nodejs modules */
var express = require('express');
require('express-namespace');
var stylus = require('stylus');
var cron = require('./thechronicle_modules/api/lib/cron');



/* require internal modules */
var globalFunctions = require('./thechronicle_modules/global-functions');
var config = require('./thechronicle_modules/config');
var api = require('./thechronicle_modules/api/lib/api');
var site = require('./thechronicle_modules/api/lib/site');
var admin = require('./thechronicle_modules/admin/lib/admin');
var mobileapi = require('./thechronicle_modules/mobileapi/lib/mobileapi');
var redisClient = require('./thechronicle_modules/api/lib/redisclient');
var RedisStore = require('connect-redis')(express);




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

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// the middleware itself does not serve the static
// css files, so we need to expose them with staticProvider


// set up session
app.use(express.cookieParser());
app.use(express.session({ secret: SECRET }));

app.error(function(err, req, res, next){
	try {
		res.send(500);
	}
	catch(err) {}
	globalFunctions.log('ERROR: ' + err.stack);
});

if(!config.isSetUp())
{
	app.get('/', function(req, res, next) {
		if(!config.isSetUp()) {
			res.redirect('/config');
		}		
		else next();
	});
}
else runSite(function() {});


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

site.assignPreInitFunctionality(app,this);

app.listen(process.env.PORT || port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

/* set http cache to one minute by default for each response */
app.use(function(req,res,next){
    res.header('Cache-Control', 'public, max-age=60');
    next();
});


exports.runSite = function(callback)
{	
	runSite(callback);
}

function runSite(callback) {
	port = config.get('SERVER_PORT');
	
	cron.init();	

    // use redis as our session store
    redisClient.init(function (err0) {
        if(err0) return console.log(err0);
        app.use(express.session({
            secret: SECRET,
            store: new RedisStore({
                host:redisClient.getHostname(),
                port:redisClient.getPort(),
                pass:redisClient.getPassword()
            })
        }));
    });


    site.init(app, function(err){
        //api.search.removeAllDocsFromSearch(function(){});
         if(err)
             return console.log("Site.init Failed!");

         admin.init(app, function(err2){
             if(err2)
                 return console.log("Admin.init Failed!");
             mobileapi.init(app, function(err3){
                 if(err3)
                    return console.log("mobile.init Failed!");

                 // initialize cron

                 return callback();
             });
         });
    });
}
