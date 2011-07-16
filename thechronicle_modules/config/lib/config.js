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

config.init = function(callback) {
	client.HGETALL(configHashKey, function(err, obj) {
		if (err) throw err;
		configCache = obj;
		if (typeof callback !== "undefined") {
			callback(err, obj);
		}
	});
};

client.on("error", function (err) {
    console.log("Error " + err);
});

client.HGETALL(configHashKey, function(err, obj) {
	if (err) throw err;
	console.log(obj);
});

config.set = function(variable, value, callback) {
	client.HSET(configHashKey, variable, value, function(err, result) {
		if (err) throw err;
		config.init(callback);
	});
};

config.get = function(variable, defaultValue) {
	// first check envrionment var, then redis, then defaultValue
	if (process.env[variable]) {
		return process.env[variable];
	} else if (configCache[variable]) {
		console.log(configCache);
		return configCache[variable];
	} else {
		return defaultValue;
	}
};