var express = require('express');
var async = require('async');

var app = express.createServer();

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
	app.use(express.static(__dirname + '/static'));
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

var api = require('./api/api.js');

app.get('/', function(req, http_res) {
    http_res.render('main');
});

app.get('/article/:url', function(req, http_res) {
    var url = req.params.url;
    api.list_urls(function(err, res) {
        for(var i in res) {
            if(url === res[i].key) {
                api.get_document_by_id(res[i].id, function(db_err, doc) {
                    http_res.render('article', {
                        locals: {doc: doc}
                    });
                });
                return;
            }
        }
        http_res.render('error', {
            locals: {
                message: "Article not found."
            }
        });
    });
});

app.get('/add', function(req, http_res) {
    api.bin.list(function(err, res) {
        var bins = [];
        for(var i in res) {
            bins.push(res[i].value.bin_name);
        }
        http_res.render('add', {
            locals: {bins: bins}
        });
    });
});

app.post('/add', function(req, http_res) {
    var fields = {body: req.body.doc.body};
    api.add_document(fields, req.body.doc.title, function(err, res, url) {
        if(err) {
            http_res.render('error', {
                locals: {message: err}
            });
        } else {
            var bins = req.body.doc.bins;
            if(bins) {
                var fcns = [];
                if(!(bins instanceof Array)) { //we will get a string if only one box is checked
                    bins = [bins];
                }
                
                api.bin.add(res.id, bins, function(add_err, add_res) {
                    if(add_err) {
                        http_res.render('error', {
                            locals: {message: add_err}
                        });
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