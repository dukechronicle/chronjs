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
    http_res.render('add');
});

app.post('/add', function(req, http_res) {
    var fields = {body: req.body.doc.body};
    api.add_document(fields, req.body.doc.title, function(err, res, url) {
        if(err) {
            http_res.render('error', {
                locals: {message: err}
            });
        } else {
            http_res.render('add', {
                locals: {url: url}
            });
        }
    })
})

app.listen(4000);