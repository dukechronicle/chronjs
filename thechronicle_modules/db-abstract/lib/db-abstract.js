var cradle = require('cradle');
var _ = require('underscore');
var config = require('../../config');
var url = require("url");
var fs = require('fs');

var DESIGN_DOCUMENT_NAME = '_design/articles';
var DESIGN_DOCUMENT_FILENAME = __dirname+'/db_design.js';
var DESIGN_DOCUMENT_VERSION_NAME = DESIGN_DOCUMENT_NAME+'-versioning';
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
		
		viewsAreUpToDate(db, function(isUpToDate,newestModifiedTime) {
			if(!isUpToDate) {
				console.log('updating views to newest version: ' + newestModifiedTime);
				createViews(db,newestModifiedTime);
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


function createViews(db,modifiedTime) {
	var design_doc = require(DESIGN_DOCUMENT_FILENAME);	
	
	db.save(DESIGN_DOCUMENT_NAME, design_doc.getViews(), function(err, response) {
		// update the versioning info for the design document		
		db.save(DESIGN_DOCUMENT_VERSION_NAME, {lastModified: modifiedTime});
	});
}

function viewsAreUpToDate(db, callback) {
	fs.stat(DESIGN_DOCUMENT_FILENAME, function(err, stats) {
		db.get(DESIGN_DOCUMENT_VERSION_NAME, function (err, response) {
			// if the design document does not exists, or the modified time of the design doc does not exist, return false
			if(response == null || response.lastModified == null) callback(false,stats.mtime); 

			else {
				// check if the design doc file has been modified since the the last time it was updated in the db				
				if(new Date(response.lastModified) >= new Date(stats.mtime)) callback(true,response.lastModified);
				else callback(false,stats.mtime);
			}
		});
	});
}

