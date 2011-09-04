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
/*
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
*/
group.docs = function(namespace, group, callback) {
    db.group.docs(namespace, group, function(err, res) {
        console.log(res);
        // if querying name space, map each group to it's own object
        if (err) return callback(err);
        else {
            if (!group) {
                var groupedResults = {};
	            var groupName;
	            var prevGroupName;

                for (var i = 0; i < res.length; i++) {
                    var doc = res[i];
	                prevGroupName = groupName;
                    groupName = doc.key[1];
                    if (!groupedResults[groupName]) {
                        groupedResults[groupName] = [];
	                    doc.doc.cssClass = "first";

	                    if (prevGroupName && groupedResults[prevGroupName]) {
	                        groupedResults[prevGroupName][groupedResults[prevGroupName].length - 1].cssClass = "last";
	                    }
                    }
	                if (doc.doc.urls) {
		                doc.doc.url = "/article/" + doc.doc.urls[doc.doc.urls.length - 1];
	                }

                    groupedResults[groupName].push(doc.doc);
                }


                if (prevGroupName && groupedResults[prevGroupName]) {
	                groupedResults[prevGroupName][groupedResults[prevGroupName].length - 1].cssClass = "last";
                }
				/*
	            Object.keys(groupedResults).forEach(function(group) {
		            async.map()
		            _getImages(doc.images, function)
	            });
	            */

	            callback(null, groupedResults);
            } else {
	            // TODO modify this
	            return callback(null, {});
            }
        }
    });
};

group.add = function(nameSpace, groupName, docId, weight, callback) {
    db.group.add(nameSpace, groupName, docId, weight, callback);
};

group.remove = function(nameSpace, groupName, docId, callback) {
    db.group.remove(nameSpace, groupName, docId, callback);
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
