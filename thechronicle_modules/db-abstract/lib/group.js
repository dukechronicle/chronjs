var db = require('./db-abstract');

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
}

// add document to group
group.add = function (docId, namespace, group, callback) {
    //check if group exists
    db.group.list({
        key: [namespace, group]
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
            var children = res[0].value.children;
            if (children.indexOf(docId) != -1) {
                callback("Document already in this group", null);
            }
            else {
                arr.push(obj);
				//update group document
			    db.merge(groupDoc.id, {
			        docs: children
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
            var children = groupDoc.value.children;
            if (children.indexOf(docId) == -1) {
                callback("Document not in this group", null);
            }
            else {
                arr.splice(arr.indexOf(obj), 1);
			    
			    //update group document
			    db.merge(groupDoc.id, {
			        docs: children
			    }, callback);
            }
        }
    });
}