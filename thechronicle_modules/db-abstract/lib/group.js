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
    db.view('articles/groups', options,
	    function(err, res) {
	        callback(err, res);
	    }
	);
};

// fetch documents from namespace or groups
group.docs = function(namespace, group, callback) {
	var query = {};

	query.reduce = false;
    query.include_docs = true;

	if (group === null) {
		// fetch all docs in namespace
		query.startKey = [[namespace]];
		query.endKey = [[namespace], {}];
	} else {
		query.startKey = [[namespace], group];
		query.endKey = [namespace, group, {}];
	}
    
	db.view('articles/groups', query,

    function(err, res) {
	    if (err) callback(err);
    	if (res) {
    		callback(null, res);
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
group.add = function (nameSpace, groupName, docId, weight, callback) {

    db.get(docId, function(err, doc) {
        if(err) callback(err);

        var groups = doc.groups
        if (!groups) groups = [];

        // remove existing entry
        var updated = false;
        _.map(groups, function(groupEntry) {
            // [nameSpace, groupName, weight]
            // need toString to compare arrays
            if (groupEntry[0].toString() == nameSpace.toString() &&
                groupEntry[1] == groupName) {
                groupEntry[2] = weight;
                updated = true;
            }
            return groupEntry;
        });

        if (!updated) {
            groups.push([nameSpace, groupName, weight]);
        }

        console.log("merging");
        console.log(groups);
        db.merge(docId, {
                groups: groups
        }, callback);
        /*
        var docs = groupDoc.value.docs;
        if (docs.indexOf(docId) != -1) {
            callback("Document already in this group", null);
        } else {
            docs.push(docId);
            //update group document
            db.merge(groupDoc.id, {
                docs: docs
            }, callback);
        }*/
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
