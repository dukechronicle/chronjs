var _ = require("underscore");
var log = require('../../log');
var redis = require('../../redisclient');
var config = require('../../config');
var globalFunctions = require("../../global-functions");

var popular = exports;
var POPULAR_EXPIRATION_SECS = 60*60*24*7; //one week

popular.registerArticleView = function(doc, callback) {
    var unix_timestamp = globalFunctions.unixTimestamp();
    if(doc.taxonomy) {
        var length = doc.taxonomy.length;
        var taxToSend = _.clone(doc.taxonomy);

        if(unix_timestamp - doc.updated > POPULAR_EXPIRATION_SECS) {
            //remove from redis
            
            var multi = redis.client.multi();
            for(var i = length; i >= 0; i--) {
                taxToSend.splice(i, 1);
                multi.zrem(_articleViewsKey(taxToSend), _.last(doc.urls) + "||" + doc.title);
            }
            multi.exec(function(err, res) {
                if(err) {
                    log.warning("Failed to delete popular article: " + _.last(doc.urls));
                    log.warning("Redis probably throwing error because article has already been deleted.");
                    log.warning(err);
                }
                callback(err, res);
            });

        } else {
            var multi = redis.client.multi();
            for(var i = length; i >= 0; i--) {
                taxToSend.splice(i, 1);
                multi.zincrby(_articleViewsKey(taxToSend), 1, _.last(doc.urls) + "||" + doc.title);
            }
            multi.exec(function(err, res) {
                if(err) {
                    log.warning("Failed to register article view: " + _.last(doc.urls));
                    log.warning(err);
                }
                callback(err, res);
            });
        }
        
    }
}

popular.getPopularArticles = function(taxonomy, count, callback) {
    redis.client.zrevrange(_articleViewsKey(taxonomy), 0, count - 1, function(err, popular) {
        if(err)
            callback(err);
        else {
            callback(null, popular.map(function(str) {
                var parts = str.split('||');
                return {
                    urls : ['/article/' + parts[0]],
                    title : parts[1]
                };
            }));
        }   
    });
}

function _articleViewsKey(taxonomy) {
    return "article_views:" + config.get("COUCHDB_URL") + ":" + config.get("COUCHDB_DATABASE") + ":" + JSON.stringify(taxonomy);
}