var redis = require("redis");
var url = require("url");

var configHashKey = "config:dev";

// parse enviroment variable to extract login information
var redisUrl = process.env.REDISTOGO_URL || process.env.REDIS_URL;
if(!redisUrl) throw "No Redis URL specified...";
redisUrl = url.parse(redisUrl);
redisUrl.auth = redisUrl.auth.split(":");

// create redis client and authenticate
var client = redis.createClient(redisUrl.port, redisUrl.hostname);
client.auth(redisUrl.auth[1], function(err, reply) {
	if (err) {
		throw "Error Connection to redis: " + err;
	}
});

var config = exports;
var configCache = {};

client.on("error", function (err) {
    console.log("Error " + err);
});

client.HGETALL(configHashKey, function(err, obj) {
	if (err) throw err;
	console.log(obj);
});

config.set = function(variable, value, callback) {
	client.set(variable, value, function(err, result) {
		if (err) throw err;
		config.refresh(callback);
	});
};

config.refresh = function(callback) {
	client.HGETALL(configHashKey, function(err, obj) {
		if (err) throw err;
		configCache = obj;
		callback(err, obj);
	});
};

config.get = function(variable) {
	return configCache[variable];
};