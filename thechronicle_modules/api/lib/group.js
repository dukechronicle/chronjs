var nimble = require('nimble');
var _ = require('underscore');
var db = require('../../db-abstract');
var log = require('../../log');
var redis = require('../../redisclient');
var config = require('../../config');
var s3 = require('./s3');

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

group.docs = function(namespace, group, callback) {
    var redisKey = "group.docs:" + namespace.toString();
    if (group) rediskey += ":" + group.toString();

    redis.client.get(redisKey, function(err, res) {
        if (res) callback(null, JSON.parse(res));
	    else {
            groupDocs(namespace, group, function(err, results) {
                if (err)
                    callback(err);
                else {
                    redis.client.set(redisKey, JSON.stringify(results));
                    redis.client.expire(redisKey, 2);
                    callback(null, results);
                }
            });
        }
    });
};

/**
 * Add a document to a group with the given namespace and group name. The
 * document's weight in the group is specified as a parameter.
 */
group.add = function(nameSpace, groupName, docId, weight, callback) {
    db.group.add(nameSpace, groupName, docId, weight, callback);
};

/**
 * Remove a document from a group with the given namespace and group name.
 */
group.remove = function(nameSpace, groupName, docId, callback) {
    db.group.remove(nameSpace, groupName, docId, callback);
};

group.getLayoutGroups = function() {
    return _.extend({}, config.get('LAYOUT_GROUPS'));
};


function groupDocs(namespace, group, callback) {
    var start = Date.now();
    db.group.docs(namespace, group, function(err, res) {
        if (BENCHMARK) log.info("RECEIVED %d", Date.now() - start);

        if (err)
	    callback(err);
        else if (!group) {
            // if querying name space, map each group to it's own object
            var groupedResults = {};
	    var currentArticle;

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
                    
                    if(doc.url) doc.url = s3.getCloudFrontUrl(doc.url);
                    else if(doc._id.url) doc._id.url = s3.getCloudFrontUrl(doc._id.url);                   

                    currentArticle.images[imageType] = doc;
                }
            });

	    for (var groupName in groupedResults) {
		groupedResults[groupName][0].cssClass = "first";
                groupedResults[groupName][groupedResults[groupName].length - 1].cssClass = "last";
            }
	    
	    callback(null, groupedResults);
        }
	else {
            // TODO modify this
            return callback(null, {});
        }
    });
}
