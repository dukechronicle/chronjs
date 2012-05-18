var api = exports;

var db = require("../../db-abstract");
var log = require("../../log");

var async = require("async");

api.group = require("./group");
api.image = require("./image");
api.taxonomy = require("./taxonomy");
api.accounts = require("./accounts");
api.search = require("./search");
api.authors = require("./authors");
api.newsletter = require("./newsletter");
api.cron = require("./cron");
api.database = require("./database");
api.s3 = require('./s3');
api.disqus = require('./disqus');
api.site = require('./site');
api.page = require('./page');
api.article = require('./article');


api.init = function(callback) {
    db.init(function (err) {
        if(err) {
            log.error("db init failed!");
            return callback(err);
        }

        api.cron.init();
        api.search.init();
        api.image.init();
        api.newsletter.init();
        api.s3.init();
        api.site.init();
        callback(null);
    });
};

// can take one id, or an array of ids
api.docsById = function (id, callback) {
    db.get(id, callback);
}

/**
    Destroys then recreates the database the server is using. Only should be used by the environment maker!
*/
api.recreateDatabase = function(confirmCode, callback) {
    if(confirmCode == 'dsfvblkjeiofkjd') {
        db.destroy(function(err) {
            if (err) return callback(err);
            db.init(callback);
        });
    }
    else {
        callback('Confirm code wrong! Not recreating db!');
    }
};

api.getDatabaseName = db.getDatabaseName;
api.getDatabaseHost = db.getDatabaseHost;
api.getDatabasePort = db.getDatabasePort;
