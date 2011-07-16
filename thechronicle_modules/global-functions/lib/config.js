var redis = require("redis");
var url = require("url");

// parse enviroment variable to extract login information
var redisUrl = process.env.REDISTOGO_URL || process.env.REDIS_URL;
if(!redisUrl) throw "No Redis URL specified...";
redisUrl = url.parse(redisUrl);
redisUrl.auth = redisUrl.auth.split(":");

var db    = redisUrl.auth[0];
	pass    = redisUrl.auth[1],
	host    = redisUrl.hostname,
	port    = redisUrl.port;

// create redis client and authenticate
var client = redis.createClient(port, host);
client.auth(pass, function(err, reply) {
	if (err) {
		throw "Error Connection to redis: " + err;
	}
});

var config = exports;
var configCache = {};

client.on("error", function (err) {
    console.log("Error " + err);
});

client.keys("config:*", function(err, reply) {
	if (err) throw err;
	console.log(reply);
});

config.getLive = function(variable, callback) {
	client.get(variable, callback);
};

config.setLive = function(variable, value, callback) {
	client.set(variable, value, callback);
};

config.allLive = function(callback) {
	client.keys("config:*", callback);
};

config.get = function(variable) {
	return configCache['variable'];
};