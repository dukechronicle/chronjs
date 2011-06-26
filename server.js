/* declare global configuration variables */
var PORT = process.env.PORT || 4000;

/* require npm nodejs modules */
var express = require('express');
require('express-namespace');
var stylus = require('stylus');
var async = require('async');

/* require internal nodejs modules */
var globalFunctions = require('./thechronicle_modules/global-functions')
var api = require('./thechronicle_modules/api/lib/api');
var admin = require('./thechronicle_modules/admin')

/* express configuration */
var app = express.createServer();

var publicDir = '/public';
var viewsDir = '/views'

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .set('compress', true);
};

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




var homeModel = {
	twitter: {
		title: 'Keep Up',
		imageUrl: 'https://si0.twimg.com/profile_images/1157619932/Duke_Chronicle_reasonably_small.jpeg',
		user: 'DukeChronicle',
		tweet: 'RT @fhi_duke: "Why Tell Stories?" Edwidge Danticat on power of testimony in face of catastrophe http://bit.ly/gu4K8h Thanks @DukeChronicle!'
	},
	popular: {
		title: 'Most Popular',
		stories: {
			1: {title: 'Drinking policy should prioritize safety',
				comments: '3', cssClass: 'first'},
			2: {title: 'Why to take Russian Literature',
				comments: '1'},
			3: {title: 'Starcraft 2 reaches new heights in the West',
				comments: '5'},
			4: {title: 'Need for Pokemon Rights Policy Reform',
				comments: '0'},
			5: {title: 'Random article written the day before',
				comments: '14', cssClass: 'last'},
		}
	},
	ad: {
		title: 'Advertisement',
		imageUrl: 'https://www.google.com/adsense/static/en/images/inline_rectangle.gif',
		url: 'http://google.com'
	}
}

/*** FRONTEND ***/
app.get('/index', function(req, res) {
	res.render('index', {layout: false, model: homeModel});
});

app.get('/', function(req, http_res) {
    api.group.list(function(err, groups) {
        if(err) {
            globalFunctions.showError(http_res, err);
        } else {
            api.group.get_documents(groups, function(get_err, get_res) {
                if(get_err) {
                    globalFunctions.showError(http_res, get_err);
                } else {
                    http_res.render('main', {
                        locals: {
                            groups: get_res
                        }
                    });
                }
            });
        }
    });
});

app.get('/article/:url', function(req, http_res) {
    var url = req.params.url;
    
    api.docForUrl(url, function(err, doc) {
        if(err) {
            globalFunctions.showError(http_res, err);
        } else {
            http_res.render('article', {
                locals: {doc: doc}
            });
        }
    });
});

app.get('/article/:url/edit', function(req, http_res) {
    var url = req.params.url;
    api.docForUrl(url, function(err, doc) {
        if(err) {
            globalFunctions.showError(http_res, err);
        } else {
            api.group.list(function(group_err, groups) {
                if(group_err) {
                    globalFunctions.showError(http_res, group_err);
                } else {
                    http_res.render('admin/edit', {
                        locals: {doc: doc,
                                 groups: groups}
                    });
                }
            });
        }
    });
});
/*** !FRONTEND ***/

/*** ADMIN ***/
app = admin.init(app);

/*** !ADMIN ***/

console.log('Listening on port ' + PORT);
app.listen(PORT);