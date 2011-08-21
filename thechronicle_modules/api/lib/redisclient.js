var redis = require("redis");
var url = require("url");
var config = require('../../config');

// Grab redis URL from config settings.
redisUrl = config.get("REDIS_URL");

var client;

if (redisUrl) {
    redisUrl = url.parse(redisUrl);
    redisUrl.auth = redisUrl.auth.split(":");
    // create redis client and authenticate
    client = redis.createClient(redisUrl.port, redisUrl.hostname);
    client.auth(redisUrl.auth[1], function(err, reply) {
        if (err) {
            throw "Error connecting to redis: " + err;
        }
    });
    client.on("error", function (err) {
        console.log("Error " + err);
    });
}

exports.client = client;
