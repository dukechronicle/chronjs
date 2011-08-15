/* require npm nodejs modules */
var express = require('express');
require('express-namespace');
var stylus = require('stylus');

/* require internal modules */
var globalFunctions = require('./thechronicle_modules/global-functions');
var config = require('./thechronicle_modules/config');

/* express configuration */
var app = express.createServer();

var publicDir = '/public';
var viewsDir = '/views';
var port = 4000;

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
}));
app.set('view engine', 'jade');

// the middleware itself does not serve the static
// css files, so we need to expose them with staticProvider
app.use(express.static(__dirname + publicDir));
app.use(express.bodyParser());

app.set('views', __dirname + viewsDir);

app.error(function(err, req, res, next){
	res.send(500);
	globalFunctions.log('ERROR: ' + err.stack);
});

if(!config.isSetUp())
{
	app.get('/', function(req, res, next) {
		if(!config.isSetUp()) {
			res.render('admin/config', {
				locals: {
					configParams:config.getUndefinedParameters(),
					profileName:config.getActiveProfileName()
				},
				layout: 'layout-admin.jade'
			});
		}		
		else next();
	});

	app.post('/', function(req, res) {
		config.setUp(req.body, function(err) {
			if(err == null) runSite();
			res.redirect('/');
		});
	});
}
else runSite();

console.log('Listening on port ' + port);
app.listen(port);

function runSite()
{
	port = config.get('SERVER_PORT');

	/* require internal nodejs modules */
	var api = require('./thechronicle_modules/api/lib/api');
	var site = require('./thechronicle_modules/api/lib/site');
	var admin = require('./thechronicle_modules/admin/lib/admin');
	var mobileapi = require('./thechronicle_modules/mobileapi/lib/mobileapi');
	

	/*** FRONTEND ***/
	app.get('/', site.renderRoot);

	app.get('/article-list', site.renderArticleList);
	app.get('/article-list/:titleSearch', function(req, http_res) {
		site.renderArticleListSearch(req, http_res, req.params.titleSearch);
	});
	app.get('/article/:url', function(req, http_res) {
	    site.renderArticle(req, http_res, req.params.url);
	});
	app.get('/article/:url/edit', function(req, http_res) {
	    site.renderArticleEdit(req, http_res, req.params.url);
	});
	app.get('/article/:url/image', function(req, http_res) {
	    site.renderImageList(req, http_res, req.params.url);
	});
	/*** !FRONTEND ***/

	/*** ADMIN ***/
	app = admin.init(app);
	app = mobileapi.init(app);
	/*** !ADMIN ***/
}
