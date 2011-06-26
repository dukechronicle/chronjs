var db = require('./db-abstract');

var group = exports;

// lists all groups with given query options
group.list = function(options, callback) {
    db.view('articles/list_groups', options,
	    function(err, res) {
	        callback(err, res);
	    }
	);
}

// add document to group
group.add = function (docId, group, callback) {
    //check if group exists
    db.group.list({
        startkey: group,
        endkey: group
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
                _addRemoveLogic(docId, res[0], function(arr, obj) {
                    arr.push(obj);
                },
                callback);
            }
        }
    });
}

group.remove = function(docId, group, callback) {
    //check if group exists
    db.group.list({
        startkey: group,
        endkey: group
    },
    function(err, res) {
        if (res.length == 0) {
            callback("group does not exist", null);
        }
        else {
            var children = res[0].value.children;
            if (children.indexOf(docId) == -1) {
                callback("Document not in this group", null);
            }
            else {
                _addRemoveLogic(docId, res[0], function(arr, obj) {
                    var index = arr.indexOf(obj);
                    arr.splice(index, 1);
                },
                callback);
            }
        }
    });
}

function _addRemoveLogic(docid, groupDoc, logic, callback) {
    var children = groupDoc.value.children;
    //add/remove to children array
    logic(children, docid);
    
    //update group document
    db.merge(groupDoc.id, {
        children: children
    },
    callback);
}