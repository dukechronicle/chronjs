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
	if (couchdbUrl.auth) {
		couchdbUrl.auth = couchdbUrl.auth.split(":");
	}

	if (!couchdbUrl.port) {
		(couchdbUrl.protocol === "https:") ? couchdbUrl.port = 443 : couchdbUrl.port = 80;
	}
	
	var conn = new (cradle.Connection)(couchdbUrl.protocol + '//' + couchdbUrl.hostname, couchdbUrl.port, {
		auth: {username: couchdbUrl.auth[0], password: couchdbUrl.auth[1]}
	}); 
	
	var db = conn.database(database);
	
	db.exists(function (error,exists)
	{
	  	if(error) console.log("ERROR db-abstract" + error);

		// initialize database if it doesn't already exist
		if(!exists) {
			db.create();
		}
		
		db_design.viewsAreUpToDate(db, function(upToDate) {
			if(!upToDate) {
				console.log('updating views to newest version');
				db_design.createViews(db);
			}		
		});
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

