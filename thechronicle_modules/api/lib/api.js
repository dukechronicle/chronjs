var api = exports;

var nimble = require("nimble");
var async = require("async");
var db = require("../../db-abstract");
var log = require('../../log');
var config = require("../../config");
var globalFunctions = require("../../global-functions");
var _ = require("underscore");

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
api.site = require('./site');

var redis = require('../../redisclient');

var MAX_URL_LENGTH = 50;
var RESULTS_PER_PAGE = 25;

function getAvailableUrl(url, n, callback) {
    var new_url = url;
    if(n != 0) {
        new_url = new_url + "-" + n;
    }
    db.view("articles/urls", {key: [new_url, "article"]}, function(err, res) {
        if(err) {
            callback(err, null);
        }
        else if(res.rows.length == 0) {
            callback(null, new_url);
        }
        else {
            getAvailableUrl(url, n + 1, callback);
        }
    });
}

//from http://snipt.net/jpartogi/slugify-javascript/
function _URLify(s, maxChars) {

    if(maxChars === undefined) {
        maxChars = 100;
    }

    var removelist = ["a", "an", "as", "at", "before", "but", "by", "for", "from",
                  "is", "in", "into", "like", "of", "off", "on", "onto", "per",
                  "since", "than", "the", "this", "that", "to", "up", "via",
                  "with"];
    
    var r = new RegExp("\\b(" + removelist.join("|") + ")\\b", "gi");
    s = s.replace(r, "");
    
    s = s.replace(/[^-\w\s]/g, "");  // remove unneeded chars
    s = s.replace(/^\s+|\s+$/g, ""); // trim leading/trailing spaces
    s = s.replace(/[-\s]+/g, "-");   // convert spaces to hyphens
    s = s.toLowerCase();             // convert to lowercase
    return s.substring(0, maxChars);// trim to first num_chars chars
}

api.init = function(callback) {
    db.init(function (err) {
        if(err) {
            log.error("db init failed!");
            return callback(error);
        }

      	api.cron.init();
        api.search.init();
        api.newsletter.init();
        api.s3.init();
        api.site.init();

        //api.database.findDuplicateUrls(100);
        //api.search.indexUnindexedArticles(1);
        /** Chron Jobs! **/
        /*
        new api.cron.CronJob('0 * * * * *', function() {
            process.nextTick(function() {
                api.search.indexUnindexedArticles(300);
            });
        });*/

        callback(null);
    });
};

api.getArticles= function(parent_node, count, callback) {
    var start = [parent_node];
    var end = [parent_node, {}];
    db.view("articles/descendants", {
        startkey: start,
        endkey: end,
        limit: count
    },
    callback);
};

api.editDoc = function(docid, fields, callback) {
    var indexFunc = function(err, res, url) {
 	     if(err) return callback(err, res, url);	
       
         // only reindex the article if they edited the search fields            
         if(fields.title && fields.body) {
             api.search.indexArticle(docid, fields.title, fields.body, fields.taxonomy, fields.authors, fields.created, function(err2) {
                 callback(err2, res, url);
             });
         }
         else callback(err, res, url);	
    };

    api.docsById(docid, function(geterr, res) {
        if(geterr) return callback(geterr, null, null);


        if(res.created) fields.created = res.created;

        if(fields.title && (_URLify(fields.title, MAX_URL_LENGTH) !== _URLify(res.title, MAX_URL_LENGTH))) {
            getAvailableUrl(_URLify(fields.title, MAX_URL_LENGTH), 0, function(err, url) {
                if(err) return callback(err, null, null);
               
                fields.updated = globalFunctions.unixTimestamp();
                fields.urls = res.urls;
                fields.urls.push(url);
                db.merge(docid, fields, function(db_err, db_res) {
                    indexFunc(db_err, db_res, url);
                });
            });
        }
        else {
            db.merge(docid, fields, function(db_err, db_res) {
                if (db_err) return callback(db_err);
                
                indexFunc(db_err, db_res, res.urls[res.urls.length - 1]);
            });
        }    
    });
};

api.deleteDoc = function(docId, rev, callback) {
    db.remove(docId, rev, function (err) {
        if (err) callback(err);
        else api.search.unindexArticle(docId, callback);
    });
};

// can take one id, or an array of ids
api.docsById = function(id, callback) {
    db.get(id, callback);
};

api.docsByAuthor = function(author, callback) {
    var decodeAuthor = decodeURIComponent(author);
    var query = {descending: true, startkey:decodeAuthor, endkey: decodeAuthor};
    db.view("articles/authors", query, function(err, docs) {
        if (err) callback(err);
        else callback(null, _.map(docs, function(doc){return doc.value}));
    });
};

api.addDoc = function(fields, callback) {
    if (fields.type === 'article') {
        getAvailableUrl(_URLify(fields.title, MAX_URL_LENGTH), 0, function(err, url) {
            if(err){
                return callback(err, null, null);
            }
            else {
                var unix_timestamp = globalFunctions.unixTimestamp();
                fields.created = fields.created || unix_timestamp;
                fields.updated = fields.created || unix_timestamp;
                fields.urls = [url];
                fields.indexedBySolr = api.search.getIndexVersion();
                
                // strip all html tags from the teaser
                fields.teaser = fields.teaser.replace(/<(.|\n)*?>/g,"");

                db.save(fields, function(db_err, res) {

                    if(db_err) return callback(db_err);

                    api.search.indexArticle(res.id, fields.title, fields.body, fields.taxonomy, fields.authors, fields.created, function(err) {
                        callback(err,url,res.id);
                    });
                });
            }
        });
    } else {
        return callback("unknown doc type", null);
    }
};

api.addNode = function(parent_path, name, callback) {
    parent_path.push(name);
    db.save({
        type: "node",
        path: parent_path
    }, 
    callback);
};

api.articleForUrl = function(url, callback) {
    var query = {
        startkey: [url],
        endkey: [url, {}],
        include_docs: true,
        limit: 20
    };

    db.view("articles/urls", query, function(err, docs) {

        if (err) return callback(err);
        if (docs.length === 0) {
            return callback("Article does not exist");
        }
        var docTypeKey = 1;
        var aggregateDoc = {};

        docs.forEach(function(key, doc) {
            var docType = key[docTypeKey];

            if (docType === 'article') {
                aggregateDoc = doc;
                aggregateDoc.images = {};
            } else if (docType === 'images') {
                if(doc.url) doc.url = api.s3.getCloudFrontUrl(doc.url);
                else if(doc._id.url) doc._id.url = api.s3.getCloudFrontUrl(doc._id.url);                     

                var imageType = key[docTypeKey+ 1];
                // TODO this should NEVER happen

                aggregateDoc.images[imageType] = doc;
            }
        });

        callback(null, aggregateDoc);
    });
};

api.docForUrl = function(url, callback) {
    var query = {
        startkey: [url],
        endkey: [url, {}],
        include_docs: true,
        limit: 20
    };

    db.view("articles/urls", query, function(err, docs) {
        if (err) return callback(err);
        var docTypeKey = 1;

        docs.forEach(function(key, doc) {
            var docType = key[docTypeKey];
            if (docType === 'article') return callback(null, doc);
        });
    });
};

api.nodeForTitle = function(url, callback) {
    db.view("articles/nodes", { key: url }, function(err, res) {
        if (err) callback(err);
        else if (res.length == 0) callback("Node not found: " + url);
        else api.docsById(res[0].id, callback);
    });
};

api.docsByDate = function(beforeKey, beforeID, callback) {
    var query = {
        descending:true,
        limit: RESULTS_PER_PAGE
    };

    if(beforeKey) query.startkey = parseInt(beforeKey);
    if(beforeID) query.startkey_docid = beforeID;

    db.view("articles/all_by_date", query, function(err, results) {
        if (err) callback(err);

        // return only the array of the result values
        callback(null, results.map(function(result) {
            return result;
        }));
    });
};

api.addToDocArray = function(id, field, toAdd, callback) {
    async.waterfall([
        function(acallback) {
            api.docsById(id, acallback);
        },
        function(doc, acallback) {
            var arr = doc[field];
            if(!arr) arr = [];
            arr.push(toAdd);
            var fields = {};
            fields[field] = arr;
            db.merge(id, fields, acallback);
        }
        ], 
        callback
    );
};

api.removeFromDocArray = function(id, field, toRemove, callback) {
    async.waterfall([
        function(acallback) {
            api.docsById(id, acallback);
        },
        function(doc, acallback) {
            var arr = doc[field];
            var fields = {};
            if(!arr) {
                acallback("Field does not exist");
            } else if(arr.indexOf(toRemove) == -1) {
                acallback("Item not in array");
            } else {
                arr.splice(arr.indexOf(toRemove), 1);
                fields[field] = arr;
                db.merge(id, fields, acallback);
            }
        }
        ],
        callback
    );
};

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

api.getDatabaseName = function() {
    return db.getDatabaseName();
};

api.getDatabaseHost = function() {
    return db.getDatabaseHost();
};

api.getDatabasePort = function() {
    return db.getDatabasePort();
};
