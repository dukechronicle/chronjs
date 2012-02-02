var redis = require("redis");
var url = require("url");
var config = require('../../config');
var log = require('../../log');
var _ = require("underscore");

var client;
var redisUrl;

exports.init = function (callback) {
        // Grab redis URL from config settings.
        redisUrl = config.get("REDIS_URL");
        console.log(redisUrl);
        redisUrl = url.parse(redisUrl);

        // create redis client and authenticate
        client = redis.createClient(redisUrl.port, redisUrl.hostname);

        client.on("error", function (err) {
            log.error(err);
        });

        log.notice("connecting to redis " + redisUrl.hostname + ":" + redisUrl.port);

        if (redisUrl.auth) {
            redisUrl.auth = redisUrl.auth.split(":");
            client.auth(redisUrl.auth[1], function (err, reply) {
                log.notice("authenticating to redis");
                if (err) {
                    log.error("Error connecting to redis: " + err);
                    return callback(err);
                }
            });
        }
        exports.client = client;
        return callback(null);
};

exports.client = client;

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
