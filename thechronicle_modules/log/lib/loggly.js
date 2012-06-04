var util = require('../../util');
var winston = require('winston');
require('winston-loggly')
var Transport = winston.transports.Transport;
var Loggly = winston.transports.Loggly;


var CustomLoggly = exports.CustomLoggly = function(options) {
    Loggly.call(this, options);
    this.name = 'custom_loggly';
};

util.inherits(CustomLoggly, Loggly);

CustomLoggly.prototype.name = 'custom_loggly';

CustomLoggly.prototype.logException = function (msg, meta, callback) {
    Loggly.prototype.logException(msg, {stack: meta.stack}, callback);
};
