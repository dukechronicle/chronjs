var errs = require('errs');

var redis = require("redis");
var url = require("url");
var config = require('../../config');
var log = require('../../log');
var _ = require("underscore");

var client = null;
var redisUrl;

exports.init = function (callback) {
    redis.debug_mode = false;
    
    // Grab redis URL from config settings.
    redisUrl = config.get("REDIS_URL");

    if(!redisUrl) return callback("redis server not defined");
    redisUrl = url.parse(redisUrl);

    // close old connection if it exists            
    if(client) client.end();
    
    // create redis client and authenticate            
    client = redis.createClient(redisUrl.port, redisUrl.hostname);

    client.on("error", function (err) {
        log.error(errs.merge(err, {
            name: 'RedisError',
            message: 'Redis error',
        }));
    });

    if (redisUrl.auth) {
        redisUrl.auth = redisUrl.auth.split(":");

        client.auth(redisUrl.auth[1], function (err, reply) {
            if (err) {
                log.error("Error connecting to redis: " + err);
                return callback(err);
            }
            callback(null);
        });
    }
    exports.client = client;
};

exports.getHostname = function () {
    return redisUrl.hostname;
};

exports.getPort = function () {
    return redisUrl.port;
};

exports.getPassword = function () {
    if (!redisUrl.auth) return null;
    return redisUrl.auth[1];
};
