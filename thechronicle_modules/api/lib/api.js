var api = exports;

var config = require("../../config");
var db = require("../../db-abstract");
var globalFunctions = require("../../global-functions");
var log = require("../../log");
var redis = require('../../redisclient');

var async = require("async");
var md = require('node-markdown').Markdown;
var nimble = require("nimble");
var sprintf = require('sprintf').sprintf;
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
api.disqus = require('./disqus');
api.site = require('./site');
api.page = require('./page');


var MAX_URL_LENGTH = 50;
var RESULTS_PER_PAGE = 25;

var VIDEO_PLAYERS = {
    "youtube": "<iframe width=\"560\" height=\"345\" src=\"http://www.youtube.com/embed/%s\" frameborder=\"0\" allowfullscreen></iframe>",
    "vimeo": "<iframe src=\"http://player.vimeo.com/video/%s?title=0&amp;byline=0&amp;portrait=0\" width=\"400\" height=\"225\" frameborder=\"0\"></iframe>"
};
var VIDEO_REGEX_FORMAT = "(\{%s:)([^}]+)(\})";


function renderBody(body) {
    _.each(VIDEO_PLAYERS, function (tag, name) {
        var pattern = new RegExp(sprintf(VIDEO_REGEX_FORMAT, name), 'g');
        body = body.replace(pattern, function(match) {
            return sprintf(tag, RegExp.$2);
        });
    });
    return md(body);
}

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
    maxChars = maxChars || MAX_URL_LENGTH;

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
        api.image.init();
        api.newsletter.init();
        api.s3.init();
        api.site.init();
        callback(null);
    });
};

api.addDoc = function(fields, callback) {
    if (fields.type === 'article') {
        getAvailableUrl(_URLify(fields.title), 0, function(err, url) {
            if (err) return callback(err);

            var unix_timestamp = globalFunctions.unixTimestamp();
            fields.created = fields.created || unix_timestamp;
            fields.updated = fields.created || unix_timestamp;
            fields.urls = [url];
            fields.indexedBySolr = api.search.getIndexVersion();
            fields.renderedBody = renderBody(fields.body);

            // strip all html tags from the teaser
            fields.teaser = fields.teaser.replace(/<(.|\n)*?>/g,"");

            db.save(fields, function(err, res) {
                if (err) return callback(err);
                api.search.indexArticle(res.id, fields.title, fields.renderedBody,
                                        fields.taxonomy, fields.authors,
                                        fields.created, function (err) {
                                            if (err) callback(err);
                                            else callback(null, url, res.id);
                                        });
            });
        });
    }
    else callback("Unknown document type");
};

api.editDoc = function(docid, fields, callback) {
    api.docsById(docid, function(err, res) {
        if (err) callback(err);
        else {
            if (fields.body) fields.renderedBody = renderBody(fields.body);
            fields.updated = globalFunctions.unixTimestamp();            
            
            if (fields.title && (_URLify(fields.title) !=  _URLify(res.title))){
                getAvailableUrl(_URLify(fields.title), 0, function(err, url) {
                    if (err) return callback(err);
                   
                    fields.urls = res.urls;
                    fields.urls.push(url);
                    
                    saveEditedDoc(docid, fields, res.created, url, callback);
                });
            }
            else saveEditedDoc(docid, fields, res.created, _.last(res.urls), callback);
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

api.docsByDate = function(limit, query, callback) {
    query = _.defaults(query || {}, {
        descending: true,
        limit: limit || RESULTS_PER_PAGE
    });

    db.view("articles/all_by_date", query, function(err, results) {
        if (err) callback(err);
        else callback(null, _.map(results, function(doc){return doc.value}));
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

function saveEditedDoc(docid, doc, docCreatedDate, url, callback) {
    // reset redis cache
    redis.client.del("article:" + url);

    db.merge(docid, doc, function(err, res) {
     	if (err) callback(err);
        
        // only reindex the article if they edited the search fields
        else if (doc.title && doc.body) {
            api.search.indexArticle(docid, doc.title, doc.renderedBody, doc.taxonomy, doc.authors, docCreatedDate, function (err) {
                if (err) callback(err);
                else callback(null, url);
            });
        }
        else callback(null, url);
    });
}
