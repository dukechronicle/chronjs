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

function _call_add_bin(item, callback) {
    callback(null, function(acallback) {
        api.bin.add(item.id, item.bin, acallback);
    });
}

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
                
                var bin_pairs = [];
                for(var i in bins) {
                    bin_pairs.push({
                        bin: bins[i],
                        id: res.id
                    });
                }
                async.map(bin_pairs, _call_add_bin, function(map_err, results) {
                    async.series(results, function(ser_err, ser_res) {
                        if(ser_err) {
                            http_res.render('error', {
                                locals: {message: ser_err}
                            });
                        } else {
                            http_res.redirect('article/' + url);
                        }
                    });
                });
            } else {
                http_res.redirect('article/' + url);
            }
        }
    });
});

app.listen(4000);