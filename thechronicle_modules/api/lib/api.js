var api = {};
var exports = module.exports = api;

var nimble = require("nimble");
var async = require("async");
var db = require("../../db-abstract");
var config = require("../../config");
var solr = require('solr');
var _ = require("underscore");

api.group = require("./group");
api.image = require("./image");
api.taxonomy = require("./taxonomy");
api.accounts = require("./accounts");

var MAX_URL_LENGTH = 50;

function getAvailableUrl(url, n, callback) {
    var new_url = url;
    if(n != 0) {
        new_url = new_url + "-" + n;
    }
    db.view("articles/urls", {key: new_url}, function(err, res) {
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
	    max_chars = 100;
	}

    removelist = ["a", "an", "as", "at", "before", "but", "by", "for", "from",
                  "is", "in", "into", "like", "of", "off", "on", "onto", "per",
                  "since", "than", "the", "this", "that", "to", "up", "via",
                  "with"];
    
	r = new RegExp("\\b(" + removelist.join("|") + ")\\b", "gi");
    s = s.replace(r, "");
	
    s = s.replace(/[^-\w\s]/g, "");  // remove unneeded chars
    s = s.replace(/^\s+|\s+$/g, ""); // trim leading/trailing spaces
    s = s.replace(/[-\s]+/g, "-");   // convert spaces to hyphens
    s = s.toLowerCase();             // convert to lowercase
    return s.substring(0, maxChars);// trim to first num_chars chars
}

api.init = function(callback) {
	db.init(function(error) {
        if(error)
        {
            console.log("db init failed!");
            return callback(error);
        }

        api.indexUnindexedArticles();

        callback(null);
    });
}

// check for unindexed articles and index them in solr.
api.indexUnindexedArticles = function() {
    console.log('looking for articles to index...');
    api.docsNotIndexed(function(err, response) {
        // Attempt to index each file in row.
        response.forEach(function(row) {
            console.log('indexing "' + row.title + '"');
            api.indexArticle(row._id,row.title,row.body, function(error2, response2) {
                if(error2) console.log(error2);
                else {
                    db.merge(row._id, {indexedBySolr: true}, function(error3, response3) {
                        if(error3) console.log(error3);
                        else console.log('indexed "' + row.title + '"');
                    });
                }
            });
        });
    });
}

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

function _editDocument(docid, fields, callback) {
    api.docsById(docid, function(geterr, res) {
        if(geterr)
            return callback(geterr, null, null);

        if(fields.title && (_URLify(fields.title, MAX_URL_LENGTH) !== _URLify(res.title, MAX_URL_LENGTH))) {
            console.log("new url");
            console.log(fields.title);
            getAvailableUrl(_URLify(fields.title, MAX_URL_LENGTH), 0, function(err, url) {
                if(err) {
                    callback(err, null, null);
                }
                else {
                    var unix_timestamp = Math.round(new Date().getTime() / 1000);
                    fields.updated = unix_timestamp;
                        fields.urls = res.urls;
                        fields.urls.push(url);
                    db.merge(docid, fields, function(db_err, db_res) {
                        callback(db_err, db_res, url);
                    });
                }
            });
        } else {
            db.merge(docid, fields, function(db_err, db_res) {
                if (db_err) callback(db_err)
                else {
                    callback(db_err, db_res, res.urls[res.urls.length - 1]);
                }
            });
        }
            
    });
}

api.editDoc = function(docid, fields, callback) {
	/*
    var groups = fields.groups;
    if(fields.groups) {
        fcns["groups"] = function(acallback) {
            _edit_group(docid, groups, acallback);
        };
        delete fields.groups; //we will edit this field in group.edit
    }*/

        _editDocument(docid, fields, callback);
}

// can take one id, or an array of ids
api.docsById = function(id, callback) {
    db.get(id, callback);
};

api.docsByAuthor = function(author, callback) {
    db.view("articles/authors", {
        startkey: author,
        endkey: author
    }, 
    callback);
}

api.docsNotIndexed = function(callback) {
    db.view("articles/not_indexed_by_solr", callback);
}

api.addDoc = function(fields, callback) {
    
    getAvailableUrl(_URLify(fields.title, MAX_URL_LENGTH), 0, function(err, url) {
        if(err){
            return callback(err, null, null);
        }
        else {
            var unix_timestamp = Math.round(new Date().getTime() / 1000);
            fields.created = unix_timestamp;
            fields.updated = unix_timestamp;
            fields.urls = [url];
	    fields.indexedBySolr = true;

            db.save(fields, function(db_err, res) {
		    
		    if(db_err) callback(db_err);
			
		    api.indexArticle(res.id,fields.title,fields.body, function(err, response) {
			callback(err,response,url);
		    });
            });
        }
    });
}

api.indexArticle = function(id,title,body,callback) {
	// adds the article to the solr database for searching	
	var client = solr.createClient(config.get('SOLR_HOST'),config.get('SOLR_PORT'),config.get('SOLR_CORE'),config.get('SOLR_PATH'));
	console.log((title));
	var solrDoc = {
		id: id+"||"+db.getDatabaseName(), // since we may be using multiple dbs that all use the same db document id, to make each doc unique we append the db name to the back. otherwise, one db's indexes will overwrite another db's indexes in solr.
		type: 'article',
		title_text: title.toLowerCase(),
		body_text:  body.toLowerCase(),
		database_text: db.getDatabaseName()
	};

	client.add(solrDoc, {commit:true}, callback);
}

api.addNode = function(parent_path, name, callback) {
    parent_path.push(name);
    db.save({
        type: "node",
        path: parent_path
    }, 
    callback);
}

api.docForUrl = function(url, callback) {
    db.view("articles/urls", {
        key: url
    },
    function(err, res) {
        for(var i in res) {
            if(url === res[i].key) {
                api.docsById(res[i].id, callback);
                return;
            }
        }
        callback("Not found", null);
    });
}

api.docsByDate = function(limit, callback) {
	var query = {descending: true};

	if (limit) {
		query.limit = limit;
	}
		db.view("articles/all_by_date", query, function(err, results) {
			if (err) callback(err);

			// return only the array of the result values
			callback(null, results.map(function(result) {
				return result;
			}));
		});
}

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
}

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
}

// don't call this.
// removes all indexes from solr for the db we are using and sets all documents in the db we are using to not being indexed by solr
api.removeAllDocsFromSearch = function(callback) {
    var client = solr.createClient(config.get('SOLR_HOST'),config.get('SOLR_PORT'),config.get('SOLR_CORE'),config.get('SOLR_PATH')); 		
    
    api.docsByDate(null, function(err, response) {
        response.forEach(function(row) {
                console.log('unindexing "' + row.title + '"');
                client.del(row._id+"||"+db.getDatabaseName(), null, function(err,resp) { 
                    console.log(resp);
                    db.merge(row._id, {indexedBySolr: false}, function(error3, response3) {
                        if(error3) console.log(error3);
                        else console.log('unindexed "' + row.title + '"');
                    });
                });
        });
    });     
    callback(null);
}

api.docsByTitleSearch = function(title, callback) {
	title = title.toLowerCase().replace(/ /g,'* OR title_text:');			
	var query = "database_text:"+db.getDatabaseName()+" AND (title_text:"+title+"*)";
	
	var client = solr.createClient(config.get('SOLR_HOST'),config.get('SOLR_PORT'),config.get('SOLR_CORE'),config.get('SOLR_PATH')); 		
	client.query(query, {rows: 25, fl: "*,score", sort: "score desc"}, function(err,response) {
		if(err) {
			callback(err);
		}

		var responseObj = JSON.parse(response);
		console.log(responseObj);
		
		var ids = [];
        var tempid;
		var docs = responseObj.response.docs;
		console.log(docs);
		for(var docNum in docs)
		{
            tempid = docs[docNum].id.split("||",1); // since our solr document ids are stored as db_id||DBNAME we need to parse out the db_id to use
            ids.push(tempid[0]);
		}
		
		api.docsById(ids,function(err, docs) {
			if (err) callback(err);

			// replace each array element with the actual document data for that element			
			docs = _.map(docs, function(doc) {
				return doc.doc;
			});
			
			// remove any null array elements.
			docs = _.compact(docs);

			callback(null,docs);
		});
	});
}
