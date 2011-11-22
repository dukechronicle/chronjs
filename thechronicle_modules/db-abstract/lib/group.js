var db = require('./db-abstract');
var nimble = require('nimble');
var _ = require("underscore");
var util = require('util');

var BENCHMARK = false;
var group = exports;

// create a new entry for group
group.create = function (namespace, name, callback) {
    db.save({
        type:'group',
        namespace:namespace,
        name:name,
        docs:[]
    }, callback);
};

// lists all groups with given query options
group.list = function(options, callback) {
    db.view('articles/groups', options,
        function(err, res) {
            callback(err, res);
        }
    );
};

// fetch documents from namespace or groups
group.docs = function (namespace, group, callback) {
    if (BENCHMARK) var start = Date.now();
    var query = {};

    query.reduce = false;
    query.include_docs = true;


    if (group === null) {
        // fetch all docs in namespace
        query.startkey = [namespace];
        query.endkey = [namespace, {}];
    } else {
        query.startkey = [namespace, group];
        query.endkey = [namespace, group, {}];
    }
    db.view('articles/groups', query,
            function (err, res) {
                if (BENCHMARK) console.log("QUERY RECEIVED %d", Date.now() - start);
                if (err) return callback(err);
                if (res) {
                    //console.log(res);
                    callback(null, res);
                } else {
                    callback(null, []);
                }
            }
    );
};

group.docsN = function (namespace, groupName, baseDocNum, numDocs, callback) {
    db.view('articles/group_docs', {
                key:[namespace, groupName]
            },
            function (err, res) {
                if (res) {
                    // fetch each child document after getting their id
                    var resN = {};
                    var counter = 0;

                    for (var doc in res) {
                        if (counter >= numDocs)
                            break;
                        if (counter < baseDocNum)
                            continue;
                        resN[doc] = res[doc];
                        counter++;
                    }

                    nimble.map(resN, function (docId, cbck) {
                        cbck(null, function (acallback) {
                            db.get(docId.value, acallback);
                        });
                    }, function (map_err, map_res) {
                        nimble.parallel(map_res, callback);
                    });
                } else {
                    callback(null, []);
                }
            });
};


// add document to group
group.add = function (nameSpace, groupName, docId, weight, callback) {

    db.get(docId, function (err, doc) {
        if (err) return callback(err);

        var groups = doc.groups;
        if (!groups) groups = [];

        // remove existing entry
        var updated = false;
        groups = groups.map(function (groupEntry) {
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
        console.log("adding " + doc.title + " to " + groupName);
        db.merge(docId, {
            groups:groups
        }, callback);

    });
};

// add document to group
group.remove = function (nameSpace, groupName, docId, callback) {
    db.get(docId, function (err, doc) {
        if (err) return callback(err);

        var groups = doc.groups;
        if (!groups) groups = [];

        // remove existing entry
        var updated = false;
        groups = groups.map(function (groupEntry) {
            // [nameSpace, groupName, weight]
            // need toString to compare arrays
            if (groupEntry[0].toString() == nameSpace.toString() &&
                    groupEntry[1] == groupName) {
                updated = true;
                return null;
            }
            console.log("keeping" + groupEntry);
            return groupEntry;
        });

        if (updated) {
            db.merge(docId, {
                groups:_.compact(groups)
            }, callback);
        }
    });
};
