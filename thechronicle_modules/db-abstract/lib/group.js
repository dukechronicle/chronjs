var db = require('./db-abstract');
var nimble = require('nimble');
var _ = require("underscore");

var group = exports;

// create a new entry for group
group.create = function(namespace, name, callback) {
	db.save({
		type: 'group',
		namespace: namespace,
        name: name,
        docs: []
   }, callback);
}

// lists all groups with given query options
group.list = function(options, callback) {
    db.view('articles/group_list', options,
	    function(err, res) {
	        callback(err, res);
	    }
	);
};

group.docs = function(namespace, groups, callback) {
	var query = {};
	console.log(namespace);
	if (groups === null) {
		// fetch all docs in namespace
		query.startKey = [namespace];
		query.endKey = [namespace, {}];
	} else {
		// fetch all docs in groups
		if (!_.isArray(groups)) {
			groups = [groups];
		}

		query.keys = [];
		groups.forEach(function(group) {
			query.keys.push([namespace, group]);
		});
	}

	console.log(query);
	db.view('articles/group_docs', query,
    function(err, res) {
	    console.log(res);
	    if (err) callback(err);
    	if (res) {
    		// fetch each child document after getting their id
	        nimble.map(res, function(docId, cbck) {
	            cbck(null, function(acallback) {
	                db.get(docId.value, acallback);
	            });
	        }, function(map_err, map_res) {
	            nimble.parallel(map_res, callback);
	        });
	    } else {
	    	callback(null, []);
	    }
    });
}

group.docsN = function(namespace, groupName, baseDocNum, numDocs, callback) {
	db.view('articles/group_docs', {
        key: [namespace, groupName]
    }, 
    function(err, res) {
    	if (res) {
    		// fetch each child document after getting their id
            var resN = {};
            var counter = 0;
            
	        for(var doc in res)
            {
                if(counter >= numDocs)
                    break;
                if(counter < baseDocNum)
                    continue;
                resN[doc] = res[doc];
                counter++;
            }

            nimble.map(resN, function(docId, cbck) {
	            cbck(null, function(acallback) {
	                    db.get(docId.value, acallback);
	                });
	            }, function(map_err, map_res) {
	            nimble.parallel(map_res, callback);
	        });
	    } else {
	    	callback(null, []);
	    }
    });
}


// add document to group
group.add = function (docId, namespace, groupName, callback) {
    //check if group exists
    db.group.list({
        key: [namespace, groupName]
    },
    function(err, res) {
        if(err) {
            callback(err, null);
        }
        else if (res.length == 0) {
            callback("group does not exist", null);
        }
        else {
        	// if group exists and doc isn't already in group 
        	// add docid to children array of group
        	var groupDoc = res[0];
            var docs = groupDoc.value.docs;
            if (docs.indexOf(docId) != -1) {
                callback("Document already in this group", null);
            } else {
                docs.push(docId);
				//update group document
			    db.merge(groupDoc.id, {
			        docs: docs
			    }, callback);
            }
        }
    });
}

group.remove = function(docId, namespace, group, callback) {
    //check if group exists
    db.group.list({
        key: [namespace, group]
    },
    function(err, res) {
        if (res.length == 0) {
            callback("group does not exist", null);
        }
        else {
        	var groupDoc = res[0];
            var docs = groupDoc.value.docs;
            if (docs.indexOf(docId) == -1) {
                callback("Document not in this group", null);
            }
            else {
                arr.splice(arr.indexOf(obj), 1);
			    
			    //update group document
			    db.merge(groupDoc.id, {
			        docs: docs
			    }, callback);
            }
        }
    });
}
