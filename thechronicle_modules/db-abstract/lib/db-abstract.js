var cradle = require('cradle');
var _ = require('underscore');
var db_design = require('./db_design');
var config = require('../../config');
var url = require("url");

var DATABASE = config.get("COUCHDB_DATABASE", "chronicle");

// parse environment variable CLOUDANT_URL OR COUCHDB_URL to extract authentication information
function connect(database) {
	var couchdbUrl = process.env.CLOUDANT_URL || config.get("COUCHDB_URL");
	if(!couchdbUrl) throw "No Cloudant URL specified...";
	console.log("Connecting to " + couchdbUrl);
	couchdbUrl = url.parse(couchdbUrl);
	couchdbUrl.auth = couchdbUrl.auth.split(":");

	(couchdbUrl.protocol === "https:") ? couchdbUrl.port = 443 : couchdbUrl.port = 80;
	var conn = new (cradle.Connection)(couchdbUrl.protocol + '//' + couchdbUrl.hostname, couchdbUrl.port, {
		auth: {username: couchdbUrl.auth[0], password: couchdbUrl.auth[1]}
	}); 
	
	var db = conn.database(database);
	db_design.createViews(db);
	// initialize database if it doesn't already exist
	db.exists(function (error,exists)
	{
	  	if(error) console.log("ERROR db-abstract" + error);

		if(!exists) {
			db.create();
			db_design.createViews(db);
		}
	});
   	return db;	
}

var db = exports;

// assign all methods of the cradle object to db
_.extend(db, connect(DATABASE));

db.group = require('./group.js');
db.image = require('./image.js');
db.taxonomy = require('./taxonomy.js');

db.getDatabaseName = function() {
	return DATABASE;
}

