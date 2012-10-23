var _ = require('underscore');
var crypto = require('crypto');

var log = require('../../log');
var redis = require('../../redisclient');
var util = require('../../util');

var SALT = util.randomString(100);


var cache = module.exports = function (expireTime, func) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        if (typeof(callback) !== 'function')
            throw new Error('Cache only works for asynchronous functions');

	    var md5sum = crypto.createHash('md5');
	    md5sum.update(func.toString());
        md5sum.update(JSON.stringify(args));
        md5sum.update(SALT);
	    var redisKey = md5sum.digest('hex');

        redis.client.get(redisKey, function(err, res) {
            if (!err && res) return callback(null, JSON.parse(res));

            log.notice('Cache miss');
            args.push(function (err, result) {
                if (err) return callback(err);
                redis.client.set(redisKey, JSON.stringify(result), function (err) {
                    if (err) return log.error(err);
                    redis.client.expire(redisKey, expireTime, function (err) {
                        if (err) log.error(err);
                    });
                });
                callback(null, result);
            });
            func.apply(this, args);
        });
    };
};

cache.bust = function() {
    SALT = util.randomString(100);
};
