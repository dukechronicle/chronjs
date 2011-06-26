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
    group.list({
        key: group
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
                _addRemoveLogic(docId, group, callback, res, function(arr, obj) {
                    arr.push(obj);
                });
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
                _addRemoveLogic(docId, group, callback, res, function(arr, obj) {
                    var index = arr.indexOf(obj);
                    arr.splice(index, 1);
                });
            }
        }
    });
}

// TODO refactor this to make sense
function _addRemoveLogic(docid, group, callback, dbres, logic) {
	var children = dbres[0].value.children;
    //add to group document
    logic(children, docid);
    nimble.series([
    function(acallback) {
        db.merge(dbres[0].id, {
            children: children
        },
        acallback);
    },
    function(acallback) {
        db.get(docid,
        function(err2, res2) {
            if (err2) {
                acallback(err2, null);
            }
            else {
                var groups = res2.groups;
                if(!groups) {
                    groups = [];
                }
                logic(groups, group);
                db.merge(docid, {
                    groups: groups
                },
                acallback);
            }
        });
    }], 
    callback);
}
