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