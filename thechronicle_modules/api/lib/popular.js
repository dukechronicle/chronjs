var _ = require("underscore");
var log = require('../../log');
var redis = require('../../redisclient');
var config = require('../../config');

var popular = exports;

popular.registerArticleView = function(doc, callback) {
    if(doc.taxonomy) {
		var length = doc.taxonomy.length;
		var taxToSend = _.clone(doc.taxonomy);
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

function _articleViewsKey(taxonomy) {
	return "article_views:" + config.get("COUCHDB_URL") + ":" + config.get("COUCHDB_DATABASE") + ":" + JSON.stringify(taxonomy);
}