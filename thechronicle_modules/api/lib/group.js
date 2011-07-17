var nimble = require('nimble');
var _ = require('underscore');
var db = require('../../db-abstract');

var group = exports;

// list all groups in the given namespace
group.list = function(namespace, callback) {
	var groupKey = {};
	var startIndex = 0;
	if (namespace) {
		groupKey = {
	    	startkey: [namespace],
	    	endkey: [namespace, {}]
    	};
    	startIndex = namespace.length;
	}
    db.group.list(groupKey, function(err, res) {
        if(err) {
            callback(err, null);
        } else {
        	// do not return the fully qualified, only the name/path after the namespace
            nimble.map(res, function(val, cbck) {
                cbck(null, val.key[1]);
            }, callback);
        }
    });
};

group.create = function(namespace, name, callback) {
    //check if group exists
    db.group.list({
        key: namespace.concat(name)
    }, function(err, res) {
        if(res.length === 0) {
            //doesn't exist
           	db.group.create(namespace, name, callback);
        } else {
            callback("group already exists", null);
        }
    });
};

group.add = function(docId, namespace, groupName, callback) {
	db.group.add(docId, namespace, groupName, callback);
};

group.remove = function(docid, namespace, name, callback) {
    nimble.map(name, function(item, cbck) {
        cbck(null, function(acallback) {
            db.group.remove(docid, item, acallback);
        });
    }, function(map_err, map_res) {
        nimble.series(map_res, callback);
    });
};

group.docs = function(namespace, groupName, callback) {
    var add = function(memo, item, cbk) {
        memo[item] = function(acallback) {
            db.group.docs(namespace, item, acallback);
        };
        cbk(null, memo);
    };
    nimble.reduce(groupName, add, {}, function(err, res) {
        nimble.parallel(res, callback);
    });
}

group.docsN = function(namespace, groupName, baseDocNum, numDocs, callback) {
    var add = function(memo, item, cbk) {
        memo[item] = function(acallback) {
            db.group.docsN(namespace, item, baseDocNum, numDocs, acallback);
        };
        cbk(null, memo);
    };
    nimble.reduce(groupName, add, {}, function(err, res) {
        nimble.parallel(res, callback);
    });
};


/*
function _editGroup(docid, new_groups, callback) {
	console.log(docid);
    db.get(docid, function(get_err, get_res) {
        if(get_err) {
           callback(get_err, null);
        } else {
        	// find the difference between original and old groups
            var orig_groups = get_res.groups;
            console.log(new_groups)
            nimble.series([
                function(acallback) {
                	if (orig_groups) {
	                    nimble.filter(new_groups, function(val, cbck) {
	                        cbck(null, orig_groups.indexOf(val) == -1);
	                    }, acallback);
	                } else {
						acallback(null, new_groups);
	                }
                },
                function(acallback) {
                	if (orig_groups) {
	                    nimble.filter(orig_groups, function(val, cbck) {
	                        cbck(null, new_groups.indexOf(val) == -1);
	                    }, acallback)
	                } else {
	                	acallback(null, []);
	                }
                }
            ], function(err, res) {
                nimble.series([
                    function(acallback) {
                        api.group.add(docid, res[0], acallback);
                    },
                    function(acallback) {
                        api.group.remove(docid, res[1], acallback);
                    }
                ], callback);
            });
        }
    });
}
*/
