var api = {};
var exports = module.exports = api;

var nimble = require('nimble');
var cloudant = require('../../cradle-connect');
var groups = require('./groups');

var MAX_URL_LENGTH = 50;

var db = cloudant.connect('chronicle')

api = groups.init(api, db);

function _get_available_url(url, n, callback) {
    var new_url = url;
    if(n != 0) {
        new_url = new_url + '-' + n;
    }
    db.view('articles/urls', {key: new_url}, function(err, res) {
        if(err) {
            callback(err, null);
        }
        else if(res.rows.length == 0) {
            callback(null, new_url);
        }
        else {
            _get_available_url(url, n + 1, callback);
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
    
	r = new RegExp('\\b(' + removelist.join('|') + ')\\b', 'gi');
    s = s.replace(r, '');
	
    s = s.replace(/[^-\w\s]/g, '');  // remove unneeded chars
    s = s.replace(/^\s+|\s+$/g, ''); // trim leading/trailing spaces
    s = s.replace(/[-\s]+/g, '-');   // convert spaces to hyphens
    s = s.toLowerCase();             // convert to lowercase
    return s.substring(0, maxChars);// trim to first num_chars chars
}

api.get_articles = function(parent_node, count, callback) {
    var start = [parent_node];
    var end = [parent_node, {}];
    db.view('articles/descendants', {
        startkey: start,
        endkey: end,
        limit: count
    },
    callback);
};

function _edit_document(docid, fields, callback) {
    api.get_document_by_id(docid, function(geterr, res) {
        if(geterr) {
            callback(geterr, null, null);
        } else {
            if(fields.title && (fields.title !== res.title)) {
                _get_available_url(_URLify(fields.title, MAX_URL_LENGTH), 0, function(err, url) {
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

api.edit_document = function(docid, fields, callback) {
    var fcns = {};
    var groups = fields.groups;
    if(fields.groups) {
        fcns['groups'] = function(acallback) {
            _edit_group(docid, groups, acallback);
        };
        delete fields.groups; //we will edit this field in group.edit
    }
    fcns['merge'] = function(acallback) {
        _edit_document(docid, fields, acallback);
    };
    nimble.series(fcns, callback);
}

api.get_taxonomy_tree = function(callback) {
    db.view('articles/tree',
    function(err, res) {
        if (err) {
            callback(err, res);
        }
        else {
            callback(err, res[0]["value"]);
        }
    });
};

api.get_document_by_id = function(id, callback) {
    db.get(id, callback);
};

api.get_documents_by_author = function(author, callback) {
    db.view('articles/authors', {
        startkey: author,
        endkey: author
    }, 
    callback);
}

api.add_document = function(fields, title, callback) {
    
    _get_available_url(_URLify(title, MAX_URL_LENGTH), 0, function(err, url) {
        if(err) {
            callback(err, null, null);
        }
        else {
            var unix_timestamp = Math.round(new Date().getTime() / 1000);
            fields.title = title;
            fields.created = unix_timestamp;
            fields.updated = unix_timestamp;
            fields.urls = [url];
            db.save(fields, function(db_err, res) {
                callback(db_err, res, url);
            });
        }
    });
}

api.add_node = function(parent_path, name, callback) {
    parent_path.push(name);
    db.save({
        type: "node",
        path: parent_path
    }, 
    callback);
}

api.list_urls = function(callback) {
    db.view('articles/urls', callback);
}

api.doc_for_url = function(url, callback) {
    api.list_urls(function(err, res) {
        for(var i in res) {
            if(url === res[i].key) {
                api.get_document_by_id(res[i].id, callback);
                return;
            }
        }
        callback("Not found", null);
    });
}

api.all_docs_by_date = function(callback) {
    db.view('articles/all_by_date', {descending: true}, callback);
}
