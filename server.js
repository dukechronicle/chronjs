/* declare global configuration variables */
var PORT = process.env.PORT || 4000;
var FRONTPAGE_GROUP_NAMESPACE = ['section'];

/* require npm nodejs modules */
var express = require('express');
require('express-namespace');
var stylus = require('stylus');
var async = require('async');

/* require internal nodejs modules */
var globalFunctions = require('./thechronicle_modules/global-functions')
var api = require('./thechronicle_modules/api/lib/api');
var admin = require('./thechronicle_modules/admin/lib/admin')

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

app.error(function(err, req, res, next){
	res.send(500);
  	globalFunctions.log('ERROR: ' + err.stack);
});

var homeModel = {
	twitter: {
		title: 'Twitter',
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
	adFullRectangle: {
		title: 'Advertisement',
		imageUrl: '/images/ads/monster.png',
		url: 'http://google.com'
	},
	adFullBanner: {
		title: 'Ad',
		imageUrl: '/images/ads/full-banner.jpg',
		url: 'http://google.com'
	},
	printEdition: {
		title: 'Print',
		imageUrl: '/images/issuu-thumb.jpg',
		url: 'http://google.com'
	},
	top: {
		title: 'Headlines',
		news: {
			'top': {title: 'A PRESIDENTIAL VISIT', 
					teaser: 'Although the economic recession sparked some sacrifice across the University, Duke’s revered Talent Identification Program has continued to grow during the past several years.'},
			'second': {title: 'New center for Judicial Studies created'},
			'third': {title: 'Math department earns top 10 world ranking'}
		},
		sports: {
			'top': {title: 'Bottorff crowned in Iowa',
					teaser: 'When Juliet Bottorff first stepped on the track at the NCAA championships, winning was not on her mind.'},
			'second': {title: 'Duke plans for upcoming season'},
			'third': {title: 'Duke falls in match play semis'}
		}
	},
	opinion: {
		title: 'Opinion',
		stories: {
			1: {title: 'Egypt an academic opportunity',
				comments: '3', cssClass: 'first', author: 'Editorial Board'},
			2: {title: 'Make my day',
				comments: '1', author: 'Carol Apollonio'},
			3: {title: 'Arab dictators stuck in yesteryear',
				comments: '5', author: 'Chris Bassil'},
			4: {title: 'The right to obstain',
				comments: '0', author: 'Christine Hall'},
			5: {title: 'I read programming books for fun',
				comments: '14', cssClass: 'last', author: 'Dean Chen'}
		}
	}
};

/*** FRONTEND ***/
app.get('/', function(req, res) {
	res.render('index', {layout: false, model: homeModel});
});


app.get('/article-list', function(req, http_res) {
    api.group.list(FRONTPAGE_GROUP_NAMESPACE, function(err, groups) {
        if(err) {
            globalFunctions.showError(http_res, err);
        } else {
            api.group.docs(FRONTPAGE_GROUP_NAMESPACE, groups, function(get_err, get_res) {
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
            api.group.list(['section'], function(group_err, groups) {
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
