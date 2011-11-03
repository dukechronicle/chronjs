var cradle = require('cradle');
var _ = require('underscore');
var config = require('../../config');
var url = require("url");
var fs = require('fs');
var crypto = require('crypto');

var DESIGN_DOCUMENT_NAME = '_design/articles';
var DESIGN_DOCUMENT_FILENAME = __dirname+'/db-design.js';
var DESIGN_DOCUMENT_VERSION_NAME = DESIGN_DOCUMENT_NAME+'-versioning';
var DATABASE = null;
var DB_HOST = null;
var DB_PORT = null;

// parse environment variable CLOUDANT_URL OR COUCHDB_URL to extract authentication information
function connect(database) {
    //var couchdbUrl = process.env.CLOUDANT_URL || config.get("COUCHDB_URL");
    var couchdbUrl = config.get("COUCHDB_URL");
    if(!couchdbUrl) throw "No Cloudant URL specified...";
    console.log("Connecting to " + database + " at " + couchdbUrl);
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
    
    return conn.database(database);
}

function updateViews(callback)
{
    // Check if views are up to date
    viewsAreUpToDate(function(isUpToDate,newestModifiedTime,newestHash) {
        if(!isUpToDate) {
            console.log('updating views to newest version - modified time: ' + newestModifiedTime + ' and hash: ' + newestHash);
            createViews(newestModifiedTime, newestHash, function(err){
                return callback(err);
            });
        }
        else
        {
            return callback(null);
        }
    });
}

var db = exports;

db.group = require('./group.js');
db.image = require('./image.js');
db.taxonomy = require('./taxonomy.js');
db.search = require('./search.js');
db.authors = require('./authors.js');

db.getDatabaseName = function() {
    return DATABASE;
}

db.getDatabasePort = function() {
    return DB_PORT;
}

db.getDatabaseHost = function() {
    return DB_HOST;
}

db.init = function(callback) {
	DATABASE = config.get("COUCHDB_DATABASE");
    DB_HOST = url.parse(config.get("COUCHDB_URL")).hostname;
    DB_PORT = url.parse(config.get("COUCHDB_URL")).port;

    // assign all methods of the cradle object to db
    var database = connect(DATABASE);
    _.extend(db, database);

    db.exists(function (error,exists) {
          if(error)
        {
            console.log("ERROR db-abstract" + error);
            return callback(error);
        }

        // initialize database if it doesn't already exist
        if(!exists) {
            db.create();
            whenDBExists(function() {
                updateViews(callback);
            });
        }
        else {
             updateViews(callback);
        }
    });
}

// only calls the callback when the DB exists, loops until then. Should not be used anywhere other than db init due to its blocking nature
function whenDBExists(callback) {
     db.exists(function (error,exists) {
        if(exists) callback();
        else whenDBExists(callback);     
     });
}

function createViews(modifiedTime, hash, callback) {
    var design_doc = require(DESIGN_DOCUMENT_FILENAME);

    db.save(DESIGN_DOCUMENT_NAME, design_doc.getViews(), function(err, response) {
        // update the versioning info for the design document
        if(err) return callback(err);

        db.save(DESIGN_DOCUMENT_VERSION_NAME, {lastModified: modifiedTime, hash: hash}, function(err2,res2) {
            return callback(err2);
        });
    });
}

function viewsAreUpToDate(callback) {
    var design_doc = require(DESIGN_DOCUMENT_FILENAME);    
    
    // calculate the hash of the local design doc    
    var md5sum = crypto.createHash('md5');
    var views = design_doc.getViews();
    
    // since functions can't be stringified to json, convert them to strings manually
    for(view in views) {
        var stringIt = 'map:'+views[view].map.toString();
        
        if(views[view].reduce) {
            stringIt += 'reduce:'+views[view].reduce.toString();       
        }
        views[view] = stringIt;
    }
    // compute the hash of the json object representing the design document
    md5sum.update(JSON.stringify(views));
    var localHash = md5sum.digest('base64');


    fs.stat(DESIGN_DOCUMENT_FILENAME, function(err, stats) {
        var localModifiedTime = stats.mtime;

        db.get(DESIGN_DOCUMENT_VERSION_NAME, function (err, response) {
            var currentHash = (response && response.views && response.views.hash) || '';
            
            // if the design document does not exists, or the modified time of the design doc does not exist, return false
            var currentModifiedTime = response && response.views && response.views.lastModified;
            if(!currentModifiedTime) {
                return callback(false,localModifiedTime,localHash);
            }
            // check if the design doc file has been modified since the the last time it was updated in the db, and if so, if the hash of each is different
            if(new Date(currentModifiedTime) < new Date(localModifiedTime) && currentHash != localHash)
                return callback(false,localModifiedTime,localHash);    
            else
                return callback(true,currentModifiedTime,currentHash);
        });
    });
}

