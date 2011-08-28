/* require npm nodejs modules */
var express = require('express');
require('express-namespace');
var stylus = require('stylus');

/* require internal modules */
var globalFunctions = require('./thechronicle_modules/global-functions');
var config = require('./thechronicle_modules/config');
var api = require('./thechronicle_modules/api/lib/api');
var site = require('./thechronicle_modules/api/lib/site');
var admin = require('./thechronicle_modules/admin/lib/admin');
var mobileapi = require('./thechronicle_modules/mobileapi/lib/mobileapi');

/* express configuration */
var app = express.createServer();

var publicDir = '/public';
var viewsDir = '/views';
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
	src: __dirname + viewsDir
  , dest: __dirname + publicDir
  , compile: compile
  , firebug: true
}));
app.set('view engine', 'jade');

// the middleware itself does not serve the static
// css files, so we need to expose them with staticProvider
app.use(express.static(__dirname + publicDir));
app.use(express.bodyParser());


// set up session
app.use(express.cookieParser());
app.use(express.session({ secret: SECRET }));

app.set('views', __dirname + viewsDir);

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

site.assignPreInitFunctionality(app,this);

console.log('Listening on port ' + port);
app.listen(port);

exports.runSite = function(callback)
{	
	runSite(callback);
}

function runSite(callback) {
	port = config.get('SERVER_PORT');	

    // use redis as our session store
	var RedisStore = require('connect-redis')(express);
    var redisClient = require('./thechronicle_modules/api/lib/redisclient');
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
         if(err)
             return console.log("Site.init Failed!");
         admin.init(app, function(err2){
             if(err2)
                 return console.log("Admin.init Failed!");
             mobileapi.init(app, function(err3){
                 if(err3)
                    return console.log("mobile.init Failed!");
                 return callback();
             });
         });
    });


}
