var redis = require("redis");
var url = require("url");
var config = require('../../config');
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
            console.log("Error " + err);
        });

        client.auth(redisUrl.auth[1], function(err, reply) {
            console.log("authenticating");
            if (err) {
                console.log("Error connecting to redis: " + err);
                return callback(err);
            }

            //console.log(client);

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
