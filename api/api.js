var api = {};
api.bin = {};
var exports = module.exports = api;

var cradle = require('cradle');
var nimble = require('nimble');
var MAX_URL_LENGTH = 50;

api.db_init = function() {
	var cloudantUrlRegEx = new RegExp('https://(.*?):(.*?)@(.*)')
	var cloudant_auth = cloudantUrlRegEx.exec(process.env.CLOUDANT_URL);
	var conn = new(cradle.Connection)('https://' + cloudant_auth[3], 443, {
		auth: {username: cloudant_auth[1], password: cloudant_auth[2]}
	}); 
	
	var db = conn.database('chronicle');
    db.create();
    return db;
}

var db = api.db_init();

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
    var bins = fields.bins;
    if(fields.bins) {
        fcns['bins'] = function(acallback) {
            _edit_bin(docid, bins, acallback);
        };
        delete fields.bins; //we will edit this field in bin.edit
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

//private function that is shared
_list_bins = function(options, callback) {
    db.view('articles/list_bins', options,
    function(err, res) {
        callback(err, res);
    }
);
}

api.bin.list = function(callback) {
    _list_bins({}, function(err, res) {
        if(err) {
            callback(err, null);
        } else {
            nimble.map(res, function(val, cbck) {
                cbck(null, val.key);
            }, callback);
        }
    });
}

api.bin.create = function(bin, callback) {
    //check if bin exists
    _list_bins({
        startkey: bin,
        endkey: bin
    }, function(err, res) {
        if(res.length == 0) {
            //doesn't exist
            db.save({
                bin_name: bin,
                children: []
            }, 
            callback);
        }
        else {
            callback("Bin already exists", null);
        }
    });
}

function _add_remove_logic(docid, bin, callback, dbres, logic) {

    var children = dbres[0].value.children;
    //add to bin document
    logic(children, docid);
    nimble.series([
    function(acallback) {
        db.merge(dbres[0].id, {
            children: children
        },
        acallback);
    },
    function(acallback) {
        api.get_document_by_id(docid,
        function(err2, res2) {
            if (err2) {
                acallback(err2, null);
            }
            else {
                var bins = res2.bins;
                if(!bins) {
                    bins = [];
                }
                logic(bins, bin);
                db.merge(docid, {
                    bins: bins
                },
                acallback);
            }
        });
    }], 
    callback);
}

function _add_to_bin(docid, bin, callback) {
    
    //check if bin exists
    _list_bins({
        startkey: bin,
        endkey: bin
    },
    function(err, res) {
        if(err) {
            callback(err, null);
        }
        else if (res.length == 0) {
            callback("Bin does not exist", null);
        }
        else {
            var children = res[0].value.children;
            if (children.indexOf(docid) != -1) {
                callback("Document already in this bin", null);
            }
            else {
                _add_remove_logic(docid, bin, callback, res, function(arr, obj) {
                    arr.push(obj);
                });
            }
        }
    });
}

api.bin.add = function(docid, bins, callback) {
    nimble.map(bins, function(item, cbck) {
        cbck(null, function(acallback) {
            _add_to_bin(docid, item, acallback);
        });
    }, function(map_err, results) {
        nimble.series(results, function(ser_err, ser_res) {
            callback(ser_err, ser_res);
        });
    });
}

function _remove_from_bin(docid, bin, callback) {
    //check if bin exists
    _list_bins({
        startkey: bin,
        endkey: bin
    },
    function(err, res) {
        if (res.length == 0) {
            callback("Bin does not exist", null);
        }
        else {
            var children = res[0].value.children;
            if (children.indexOf(docid) == -1) {
                callback("Document not in this bin", null);
            }
            else {
                _add_remove_logic(docid, bin, callback, res, function(arr, obj) {
                    var index = arr.indexOf(obj);
                    arr.splice(index, 1);
                });
            }
        }
    });
}

api.bin.remove = function(docid, bins, callback) {
    nimble.map(bins, function(item, cbck) {
        cbck(null, function(acallback) {
            _remove_from_bin(docid, item, acallback);
        });
    }, function(map_err, map_res) {
        nimble.series(map_res, callback);
    });
}

function _get_documents_for_bin(bin, callback) {
    db.view('articles/bin_docs', {
        startkey: bin,
        endkey: bin
    }, 
    function(err, res) {
        nimble.map(res, function(item, cbck) {
            cbck(null, function(acallback) {
                api.get_document_by_id(item.value, acallback);
            });
        }, function(map_err, map_res) {
            nimble.parallel(map_res, callback);
        });
    });
}

api.bin.get_documents = function(bins, callback) {
    var add = function(memo, item, cbk) {
        memo[item] = function(acallback) {
            _get_documents_for_bin(item, acallback);
        };
        cbk(null, memo);
    };
    nimble.reduce(bins, add, {}, function(err, res) {
        nimble.parallel(res, callback);
    });
}

function _edit_bin(docid, new_bins, callback) {
    api.get_document_by_id(docid, function(get_err, get_res) {
        if(get_err) {
           callback(get_err, null);
        } else {
            var orig_bins = get_res.bins;
            nimble.series([
                function(acallback) {
                    nimble.filter(new_bins, function(val, cbck) {
                        cbck(null, orig_bins.indexOf(val) == -1);
                    }, acallback);
                },
                function(acallback) {
                    nimble.filter(orig_bins, function(val, cbck) {
                        cbck(null, new_bins.indexOf(val) == -1);
                    }, acallback);
                }
            ], function(err, res) {
                nimble.series([
                    function(acallback) {
                        api.bin.add(docid, res[0], acallback);
                    },
                    function(acallback) {
                        api.bin.remove(docid, res[1], acallback);
                    }
                ], callback);
            });
        }
    });
}
