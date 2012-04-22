var db = require('./db-abstract');
var nimble = require('nimble');
var _ = require("underscore");
var util = require('util');

var BENCHMARK = false;
var group = exports;


// lists all groups with given query options
group.list = function(options, callback) {
    db.view('articles/groups', options, callback);
};

// fetch documents from namespace or groups
group.docs = function (namespace, group, callback) {
    if (BENCHMARK) var start = Date.now();
    var query = {
        reduce: false,
        include_docs: true
    };

    if (group === null) {
        // fetch all docs in namespace
        query.startkey = [namespace];
        query.endkey = [namespace, {}];
    } else {
        query.startkey = [namespace, group];
        query.endkey = [namespace, group, {}];
    }

    db.view('articles/groups', query, function (err, res) {
        if (BENCHMARK) console.log("QUERY RECEIVED %d", Date.now() - start);
        callback(err, res || []);
    });
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
