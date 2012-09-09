var _ = require('underscore');
var async = require('async');
var cradle = require('cradle');
var crypto = require('crypto');
var fs = require('fs');
var url = require('url');

var config = require('../../config');
var designDoc = require('./db-design').doc;
var log = require('../../log');

var DATABASE = null;
var DB_HOST = null;
var DB_PORT = null;

var db = exports;

db.group = require('./group.js');
db.image = require('./image.js');
db.taxonomy = require('./taxonomy.js');
db.search = require('./search.js');
db.authors = require('./authors.js');
db.database = require('./database.js');
db.poll = require('./poll');
db.page = require('./page.js');
db.article = require('./article.js');


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
    db.view = retry(db.view);

    db.exists(function (error,exists) {
        if(error) {
            log.error("ERROR db-abstract" + error);
            return callback(error);
        }

        // initialize database if it doesn't already exist
        if(!exists) {
            db.create(function(err, response) {
                if(err) return callback(err);
                else updateViews(callback);
            });
        }
        else {
             updateViews(callback);
        }
    });
};

function retry(func) {
    return function () {
        var self = this;
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();

        var invoke = function (callback) {
            var clonedArgs = JSON.parse(JSON.stringify(args));
            clonedArgs.push(callback);
            func.apply(self, clonedArgs);
        };

        invoke(function (err) {
            var caller = arguments.callee;
            if (err && err.error === 'noproc') {
                log.warning('Retrying database view');
                invoke(arguments.callee);
            }
            else {
                callback.apply(self, arguments);
            }
        });
    };
}

function updateViews(callback) {
    async.forEach(_.keys(designDoc), function (name, cb) {
        var document = designDoc[name];
        viewsAreUpToDate(name, designDoc[name], function(err, isUpToDate, newestModifiedTime, newestHash) {
            if (err) cb(err);
            else if (isUpToDate) cb();
            else {
                log.notice('updating views to newest version - modified time: ' + newestModifiedTime + ' and hash: ' + newestHash);
                document.lastModified = newestModifiedTime;
                document.hash = newestHash;
                db.save('_design/' + name, document, cb);
           }
       });
    }, callback);
}

function viewsAreUpToDate(name, document, callback) {
    // calculate the hash of the local design doc views
    var md5sum = crypto.createHash('md5');
    md5sum.update(JSON.stringify(document, function(key, val) {
      if (typeof val === 'function') {
        return val + ''; // implicitly `toString` it
      }
      return val;
    }));
    var localHash = md5sum.digest('base64');

    fs.stat(__dirname + '/db-design.js', function(err, stats) {
        if (err) return callback(err);

        var localModifiedTime = stats.mtime;

        db.get('_design/' + name, function (err, res) {
            if (err) return callback(null, false, localModifiedTime, localHash);

            // if the design document does not exist, or the modified time of
            // the design doc does not exist, return false check if the design
            // doc file has been modified since the the last time it was updated
            // in the db, and if so, if the hash of each is different
            var currentHash = res.hash;
            var currentModifiedTime = res.lastModified;
            if (!res.hash || (new Date(res.lastModified) < new Date(localModifiedTime) && res.hash != localHash))
                return callback(null, false, localModifiedTime, localHash);
            else
                return callback(null, true, res.lastModified, res.hash);
        });
    });
}
