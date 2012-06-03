var util = require('util');
var winston = require('winston');
var config = require('../../config');
var CustomConsole = require('./console').CustomConsole;
//var CustomLoggly = require('./loggly').CustomLoggly;


exports.init = function (callback) {
    var logger = new (winston.Logger)();

    logger.setLevels(winston.config.syslog.levels);
    logger.add(CustomConsole, {
        level: 'debug',
        msgStringify: function (msg) { return util.inspect(msg, false, null); },
        handleExceptions: true
    });

    /*
      if (process.env.NODE_ENV === 'production' && process.env.CHRONICLE_LOGGLY_SUBDOMAIN && process.env.CHRONICLE_LOGGLY_TOKEN) {
      logger.add(CustomLoggly, {
      subdomain: process.env.CHRONICLE_LOGGLY_SUBDOMAIN,
      inputToken: process.env.CHRONICLE_LOGGLY_TOKEN,
      level: 'warning',
      json: true,
      handleExceptions: true
      });
      }
    */

    logger.handleExceptions();


    // TODO: Handle logging errors with email alert
    logger.on('error', function(err) {
        console.error("Logging error: " + JSON.stringify(err));
    });

    logger.info('Logger is up');
    logger.extend(exports);
    callback();
};
