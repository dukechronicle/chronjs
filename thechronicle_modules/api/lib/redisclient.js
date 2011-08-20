var redis = require("redis");
var url = require("url");
var configProfile = "dev";
var configHashKey = "config:" + configProfile;
// parse enviroment variable to extract login information
var redisUrl = process.env.REDISTOGO_URL || process.env.REDIS_URL;

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