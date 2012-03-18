var cradle = require('cradle');
var _ = require('underscore');
var config = require('../../config');
var url = require("url");
var fs = require('fs');
var crypto = require('crypto');
var log = require('../../log');

var DESIGN_DOCUMENT_NAME = '_design/articles';
var DESIGN_DOCUMENT_FILENAME = __dirname+'/db-design.js';
var DESIGN_DOCUMENT_VERSION_NAME = DESIGN_DOCUMENT_NAME+'-versioning';
var DATABASE = null;
var DB_HOST = null;
var DB_PORT = null;

function updateViews(callback)
{
    // Check if views are up to date
    viewsAreUpToDate(function(isUpToDate,newestModifiedTime,newestHash) {
        if(!isUpToDate) {
            console.warn('updating views to newest version - modified time: ' + newestModifiedTime + ' and hash: ' + newestHash);
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
db.database = require('./database.js');
db.page = require('./page.js');

db.getDatabaseName = function() {
    return DATABASE;
};

db.getDatabasePort = function() {
    return DB_PORT;
};

db.getDatabaseHost = function() {
    return DB_HOST;
};

db.connect = function (host, database) {
    log.info("Connecting to " + database + " at " + host);
    var couchdbUrl = url.parse(host);
    if (couchdbUrl.auth) {
        couchdbUrl.auth = couchdbUrl.auth.split(":");
    }

    if (!couchdbUrl.port) {
        (couchdbUrl.protocol === "https:") ? couchdbUrl.port = 443 : couchdbUrl.port = 80;
    }

    var conn = new (cradle.Connection)(couchdbUrl.protocol + '//' + couchdbUrl.hostname, couchdbUrl.port, {
        cache: false,
        auth:{username:couchdbUrl.auth[0], password:couchdbUrl.auth[1]}
    });

    return conn.database(database);
};

db.init = function(callback) {
	DATABASE = config.get("COUCHDB_DATABASE");
    DB_HOST = url.parse(config.get("COUCHDB_URL")).hostname;
    DB_PORT = url.parse(config.get("COUCHDB_URL")).port;

    // assign all methods of the cradle object to db
    var database = db.connect(config.get("COUCHDB_URL"),DATABASE);
    _.extend(db, database);

    db.exists(function (error,exists) {
          if(error)
        {
            log.error("ERROR db-abstract" + error);
            return callback(error);
        }

        // initialize database if it doesn't already exist
        if(!exists) {
            db.create();
            db.whenDBExists(db,function() {
                updateViews(callback);
            });
        }
        else {
             updateViews(callback);
        }
    });
};

// only calls the callback when the DB exists, loops until then. Should not be used anywhere other than db init due to its blocking nature
db.whenDBExists = function(database,callback) {
     database.exists(function (error,exists) {
        if(exists) callback();
        else db.whenDBExists(database,callback);     
     });
};

function createViews(modifiedTime, hash, callback) {
    var design_doc = require(DESIGN_DOCUMENT_FILENAME);
    db.save(DESIGN_DOCUMENT_NAME, design_doc.getDoc(), function(err) {
        // update the versioning info for the design document
        if(err) return callback(err);

        db.save(DESIGN_DOCUMENT_VERSION_NAME, {lastModified: modifiedTime, hash: hash}, function(err2) {
            return callback(err2);
        });
    });
}

function viewsAreUpToDate(callback) {
    var design_doc = require(DESIGN_DOCUMENT_FILENAME);
    
    // calculate the hash of the local design doc    
    var md5sum = crypto.createHash('md5');
    var designDoc = design_doc.getDoc();

    // compute the hash of the json object representing the design document
    md5sum.update(JSON.stringify(designDoc, function(key, val) {
      if (typeof val === 'function') {
        return val + ''; // implicitly `toString` it
      }
      return val;
    }));
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

