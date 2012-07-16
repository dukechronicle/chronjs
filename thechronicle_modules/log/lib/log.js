var util = require('util');
var winston = require('winston');

var config = require('../../config');
var CustomConsole = require('./console').CustomConsole;
var CustomLoggly = require('./loggly').CustomLoggly;

var log = module.exports = createLogger();


function createLogger() {
    var logger = new winston.Logger;
    logger.setLevels(winston.config.syslog.levels);
    logger.add(CustomConsole, {
        level: 'debug',
        msgStringify: function (msg) { return util.inspect(msg, false, null); },
        handleExceptions: true
    });

    logger.handleExceptions();

    // TODO: Handle logging errors with email alert
    logger.on('error', function(err) {
        console.error("Logging error: " + JSON.stringify(err));
    });

    logger.info('Logger is up');
    return logger;
}

log.writeToLoggly = function () {
    var subdomain = config.get('LOGGLY_SUBDOMAIN');
    var inputKey = config.get('LOGGLY_TOKEN');
    if (subdomain && inputKey) {
        log.add(CustomLoggly, {
            subdomain: config.get('LOGGLY_SUBDOMAIN'),
            inputToken: config.get('LOGGLY_TOKEN'),
            level: 'warning',
            json: true,
            handleExceptions: true
        });
    }
    else {
        log.error("Couldn't add loggly transport. Check config parameters.")
    }
};
