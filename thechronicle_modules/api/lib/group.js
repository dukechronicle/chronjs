var nimble = require('nimble');
var _ = require('underscore');
var db = require('../../db-abstract');
var log = require('../../log');
var redis = require('../../redisclient');
var config = require('../../config');

var group = exports;
var BENCHMARK = false;

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
    var start = Date.now();
    var redisKey = "group.docs:" + namespace.toString()
    if (group)
        rediskey += ":" + group.toString();

    redis.client.get(redisKey, function(err, res) {
        if (res)
	    callback(null, JSON.parse(res));
	else
	    db.group.docs(namespace, group, function(err, res) {
                if (BENCHMARK) log.info("RECEIVED %d", Date.now() - start);

                // if querying name space, map each group to it's own object
                if (err)
		    callback(err);
                else if (!group) {
                    var groupedResults = {};
		    var currentArticle

                    res.forEach(function (key, doc) {
                        var groupName = key[1];
                        var docType = key[3];

                        if (docType === "article") {
			    // retain reference to current article so images
			    // that are processed next can easily access it
			    currentArticle = doc;

                            if (! (groupName in groupedResults))
				groupedResults[groupName] = [];
                            if (doc.urls)
                                doc.url = "/article/" + doc.urls[doc.urls.length - 1];

                            // remove body to save space
                            delete doc.body;
                            delete doc.renderedBody;

                            groupedResults[groupName].push(doc);

                            // TODO this should NEVER happen
                            doc.images = {};
                        }
			else if (docType === "image") {
                            var imageType = key[4];
                            currentArticle.images[imageType] = doc;
                        }
                    });

		    for (var groupName in groupedResults) {
			groupedResults[groupName][0].cssClass = "first";
                        groupedResults[groupName][groupedResults[groupName].length - 1].cssClass = "last";
                    }

                    redis.client.set(redisKey, JSON.stringify(groupedResults));
                    redis.client.expire(redisKey, 2);
                    callback(null, groupedResults);
                }
		else {
                    // TODO modify this
                    return callback(null, {});
                }
            });
    });
};

group.add = function(nameSpace, groupName, docId, weight, callback) {
    db.group.add(nameSpace, groupName, docId, weight, callback);
};

group.remove = function(nameSpace, groupName, docId, callback) {
    db.group.remove(nameSpace, groupName, docId, callback);
};

group.getLayoutGroups = function() {
    return _.extend({}, config.get('LAYOUT_GROUPS'));
};
