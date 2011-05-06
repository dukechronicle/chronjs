var express = require('express');

var app = express.createServer();

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
	app.use(express.static(__dirname + '/static'));
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

var api = require('./api/api.js');
var nimble = require('nimble');

function _error(res, message) {
    res.render('error', {
        locals: {
            message: message
        }
    });
}

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
                    http_res.render('edit', {
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
        http_res.render('add', {
            locals: {bins: bins}
        });
    });
});

app.get('/manage', function(req, http_res) {
    api.all_docs_by_date(function(err, res) {
        if(err) {
            _error(http_res, err);
        } else {
            http_res.render('manage', {
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
        body: req.body.doc.body
    };
    nimble.series([
        function(acallback) {
            api.bin.edit(id, new_bins, acallback);
        },
        function(acallback) {
            api.edit_document(id, fields, acallback);
        }
    ], function(err, res) {
        if(err) {
            _error(http_res, err);
        } else {
            http_res.redirect('/article/' + res[1][1] + '/edit');
        }
    });
});

app.post('/add', function(req, http_res) {
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

app.listen(4000);