var util = require('util');
var winston = require('winston');
var Loggly = require('winston-loggly').Loggly;


var CustomLoggly = exports.CustomLoggly = function(options) {
    Loggly.call(this, options);
    this.name = 'custom_loggly';
};

util.inherits(CustomLoggly, Loggly);

CustomLoggly.prototype.name = 'custom_loggly';

CustomLoggly.prototype.logException = function (msg, meta, callback) {
    Loggly.prototype.logException.call(this, msg, {stack: meta.stack}, callback);
};
