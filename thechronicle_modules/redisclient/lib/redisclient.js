var redis = require("redis");
var url = require("url");
var config = require('../../config');
var log = require('../../log');
var _ = require("underscore");

var client;
var redisUrl;

exports.init = function(callback) {
    // only initialize and authenticate on first run
    if (!client) {
        // Grab redis URL from config settings.
        redisUrl = config.get("REDIS_URL");

        redisUrl = url.parse(redisUrl);
        redisUrl.auth = redisUrl.auth.split(":");

        // create redis client and authenticate
        client = redis.createClient(redisUrl.port, redisUrl.hostname);

        client.on("error", function (err) {
            log.error(err);
        });

        client.auth(redisUrl.auth[1], function(err, reply) {
            log.notice("authenticating to redis");
            if (err) {
                log.error("Error connecting to redis: " + err);
                return callback(err);
            }

            //log.debug(client);

            exports.client = client;
            return callback(null);
        });
    } else {
        return callback(null);
    }
}

exports.getHostname  = function() {
    return redisUrl.hostname;
}

exports.getPort = function() {
    return redisUrl.port;
}

exports.getPassword = function() {
    return redisUrl.auth[1];
}