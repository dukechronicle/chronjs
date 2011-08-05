var api = {};
var exports = module.exports = api;

var nimble = require("nimble");
var async = require("async");
var db = require("../../db-abstract");

api.group = require("./group");
api.image = require("./image");
api.taxonomy = require("./taxonomy");

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
        if(geterr) {
            callback(geterr, null, null);
        } else {
            if(fields.title && (fields.title !== res.title)) {
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
                    callback(db_err, db_res, res.urls[res.urls.length - 1]);
                });
            }
        }
    });
}

api.editDoc = function(docid, fields, callback) {
    var fcns = {};
    var groups = fields.groups;
    if(fields.groups) {
        fcns["groups"] = function(acallback) {
            _edit_group(docid, groups, acallback);
        };
        delete fields.groups; //we will edit this field in group.edit
    }
    fcns["merge"] = function(acallback) {
        _editDocument(docid, fields, acallback);
    };
    nimble.series(fcns, callback);
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

api.addDoc = function(fields, callback) {
    
    getAvailableUrl(_URLify(fields.title, MAX_URL_LENGTH), 0, function(err, url) {
        if(err) {
            callback(err, null, null);
        }
        else {
            var unix_timestamp = Math.round(new Date().getTime() / 1000);
            fields.created = unix_timestamp;
            fields.updated = unix_timestamp;
            fields.urls = [url];
            db.save(fields, function(db_err, res) {
                callback(db_err, res, url);
            });
        }
    });
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

api.docsByDate = function(callback) {
    db.view("articles/all_by_date", {descending: true}, function(err, results) {
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
