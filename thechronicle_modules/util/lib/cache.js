var crypto = require('crypto');

var cache = exports;

var cacheStorage = {};

// ttl in milliseconds
cache.get = function(ttl, callback, func) {
	var time = new Date().getTime();
	var md5sum = crypto.createHash('md5');
	md5sum.update(callback.toString());
	var hash = md5sum.digest('hex');
	// Cache Miss
	if (typeof cacheStorage[hash] == "undefined" || cacheStorage[hash]['expires'] <= time) {
		// If cached is less than 5min expired, return anyway, but update cache
		if (typeof cacheStorage[hash] != "undefined" && cacheStorage[hash]['expires'] - 300000 <= time) {
			callback(null, cacheStorage[hash].result);
			func(function(err, result) {
				if (err == null) {
					cacheStorage[hash] = {
						result : result,
						expires : time + ttl
					};
				}
			});
		} else {
			func(function(err, result) {
				if (err) callback(err)
				cacheStorage[hash] = {
					result : result,
					expires : time + ttl
				};
				callback(null, result);
			});
		}
	} else { // Cache Hit
		callback(null, cacheStorage[hash].result);
	}
}

cache.bust = function() {
	cacheStorage = {};
}