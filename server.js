var PORT = 4000;
var express = require('express');
var stylus = require('stylus');

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

// minimal setup both reading and writting to ./public
// would look like:
//   app.use(stylus.middleware({ src: __dirname + '/public' }));

// the middleware itself does not serve the static
// css files, so we need to expose them with staticProvider

app.use(express.static(__dirname + publicDir));

app.set('views', __dirname + viewsDir);


var api = require('./api/api.js');
var nimble = require('nimble');

function _error(res, message) {
    res.render('error', {
        locals: {
            message: message
        }
    });
}

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
app.get('/index', function(req, res) {
	res.render('index', {layout: false, model: homeModel});
});

app.get('/', function(req, http_res) {
    api.bin.list(function(err, bins) {
        if(err) {
            _error(http_res, err);
        } else {
            api.bin.get_documents(bins, function(get_err, get_res) {
                if(get_err) {
                    _error(http_res, get_err);
                } else {
                    http_res.render('main', {
                        locals: {
                            bins: get_res
                        }
                    });
                }
            });
        }
    });
});

app.get('/article/:url/edit', function(req, http_res) {
    var url = req.params.url;
    api.doc_for_url(url, function(err, doc) {
        if(err) {
            _error(http_res, err);
        } else {
            api.bin.list(function(bin_err, bins) {
                if(bin_err) {
                    _error(http_res, bin_err);
                } else {
                    http_res.render('admin/edit', {
                        locals: {doc: doc,
                                 bins: bins}
                    });
                }
            });
        }
    });
});

app.get('/article/:url', function(req, http_res) {
    var url = req.params.url;
    
    api.doc_for_url(url, function(err, doc) {
        if(err) {
            _error(http_res, err);
        } else {
            http_res.render('article', {
                locals: {doc: doc}
            });
        }
    });
});

app.get('/addbin', function(req, http_res) {
    api.bin.create(req.query.addbin, function(err, res) {
        if(err) {
            _error(http_res, err);
        } else {
            http_res.redirect('/add');
        }
    })
});

app.get('/add', function(req, http_res) {
    api.bin.list(function(err, bins) {
        http_res.render('admin/add', {
            locals: {bins: bins}
        });
    });
});

app.get('/manage', function(req, http_res) {
    api.all_docs_by_date(function(err, res) {
        if(err) {
            _error(http_res, err);
        } else {
            http_res.render('admin/manage', {
                locals: {docs: res}
            });
        }
    });
});

app.post('/edit', function(req, http_res) {
    var id = req.body.doc.id;
    var new_bins = req.body.doc.bins;
    if(!(new_bins instanceof Array)) { //we will get a string if only one box is checked
        new_bins = [new_bins];
    }
    var fields = {
        title: req.body.doc.title,
        body: req.body.doc.body,
        bins: new_bins
    };
    api.edit_document(id, fields, function(err, res) {
        if(err) {
            _error(http_res, err);
        } else {
            http_res.redirect('/article/' + res.merge[1] + '/edit');
        }
    });
});

app.post('/add', function(req, http_res) {
	console.log(req);
    var fields = {body: req.body.doc.body};
    api.add_document(fields, req.body.doc.title, function(err, res, url) {
        if(err) {
            _error(http_res, err);
        } else {
            var bins = req.body.doc.bins;
            if(bins) {
                var fcns = [];
                if(!(bins instanceof Array)) { //we will get a string if only one box is checked
                    bins = [bins];
                }
                
                api.bin.add(res.id, bins, function(add_err, add_res) {
                    if(add_err) {
                        _error(http_res, add_err);
                    } else {
                        http_res.redirect('article/' + url);
                    }
                });
            } else {
                http_res.redirect('article/' + url);
            }
        }
    });
});

console.log('Listening on port ' + PORT);
app.listen(PORT);