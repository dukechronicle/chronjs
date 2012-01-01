var winston = require('winston');
var config = require('../../config');
var util = require('util');

var logger = null;
if (!logger) {
    var Console = winston.transports.Console;
    Console.prototype.superLog = Console.prototype.log;
    Console.prototype.log = function (level, msg, meta, callback) {
	if (typeof msg == "object")
	    msg = util.inspect(msg, false, null);
	Console.prototype.superLog(level, msg, meta, callback);
    };

    logger = new (winston.Logger)();

    logger.setLevels(winston.config.syslog.levels);
    logger.add(winston.transports.Console, {
    level: 'debug',
    handleExceptions: true
    });

    if (process.env.NODE_ENV === 'production' && process.env.CHRONICLE_LOGGLY_SUBDOMAIN && process.env.CHRONICLE_LOGGLY_TOKEN)
        logger.add(winston.transports.Loggly,
            {
                subdomain: process.env.CHRONICLE_LOGGLY_SUBDOMAIN,
                inputToken: process.env.CHRONICLE_LOGGLY_TOKEN,
                level: 'warning',
                json: true,
                handleExceptions: true
            }
        );

    logger.handleExceptions();


    // TODO: Handle logging errors with email alert
    logger.on('error', function(err) {
        console.error("Logging error: " + JSON.stringify(err));
    });

    logger.info('Logger is up');
}

logger.debug(logger);
logger.extend(exports);
