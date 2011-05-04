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