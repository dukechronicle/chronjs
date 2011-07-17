var redis = require("redis");
var url = require("url");

var configProfile = "dev";
var configHashKey = "config:" + configProfile;

// parse enviroment variable to extract login information
var redisUrl = process.env.REDISTOGO_URL || process.env.REDIS_URL;

if (redisUrl) {
	redisUrl = url.parse(redisUrl);
	redisUrl.auth = redisUrl.auth.split(":");

	// create redis client and authenticate
	var client = redis.createClient(redisUrl.port, redisUrl.hostname);
	client.auth(redisUrl.auth[1], function(err, reply) {
		if (err) {
			throw "Error connecting to redis: " + err;
		}
	});
	client.on("error", function (err) {
        console.log("Error " + err);
	});

} else {
	console.log("WARNING: REDIS_URL is not set, configurations may be missing");
	client = null;
}

var config = exports;
var configCache = null;

config.init = function(callback) {
	if (client) {
		client.HGETALL(configHashKey, function(err, obj) {
			if (err) throw err;

			if (configCache === null) {
				console.log(configProfile + " configuration:");
				console.log(JSON.stringify(obj, null, "\t"));
			}
			configCache = obj;

			if (typeof callback !== "undefined") {
				callback(err, obj);
			}
		});
	} else {
		if (configCache === null) configCache = {};
		callback();
	}
};

config.set = function(variable, value, callback) {
	if (client) {
		client.HSET(configHashKey, variable, value, function(err, result) {
			if (err) throw err;
			config.init(callback);
		});
	} else {
		configCache[variable] = value;
		if (typeof callback !== "undefined") {
			callback(null);
		}
	}
};

config.del = function(variable) {
	if (client) {
		client.HDEL(configHashKey, variable);
	} else {
		delete configCache[variable];
	}
};

config.get = function(variable, defaultValue) {
	// first check envrionment var, then redis, then defaultValue
	if (process.env[variable]) {
		return process.env[variable];
	} else if (configCache[variable]) {
		return configCache[variable];
	} else {
		return defaultValue;
	}
};

config.getAll = function() {
	return configCache;
}
