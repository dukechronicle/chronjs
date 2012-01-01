var winston = require('winston');
var config = require('../../config');
var util = require('util');

var logger = null;
if (!logger) {
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

    logger.superLog = logger.log;
    logger.log = function (level, msg) {
	// format msg here
	if (typeof msg == "object")
	    msg = util.inspect(msg, false, null);
	logger.superLog(level, msg);
    }


    logger.handleExceptions();

    logger.info('Logger is up');

    // TODO: Handle logging errors with email alert
    logger.on('error', function(err) {
        console.error("Logging error: " + JSON.stringify(err));
    });
}

logger.extend(exports);
