var cradle = require('cradle');
var _ = require('underscore');

var DATABASE = 'chronicle';

// parse environment variable CLOUDANT_URL OR COUHDB_URL to extract authentication information
function connect(database) {
	var cloudantUrlRegEx = new RegExp('(.*?)://(.*?):(.*?)@(.*)')
	var connect_url = process.env.CLOUDANT_URL || process.env.COUCHDB_URL;
	var cloudant_auth = cloudantUrlRegEx.exec(connect_url);
	
	if(!cloudant_auth) throw "No Cloudant URL specified...";
	var port;
	(cloudant_auth[1] === 'https') ? port = 443 : port = 80;
	
	var conn = new(cradle.Connection)(cloudant_auth[1] + '://' + cloudant_auth[4], port, {
		auth: {username: cloudant_auth[2], password: cloudant_auth[3]}
	}); 
	
	var db = conn.database(database);
    db.create();
    return db;	
}

// all functions defined inside of db variable will be available as a module function
_.extend(exports, connect(DATABASE));

var db = exports;

db.group = require('./group.js');
db.image = require('./image.js');

