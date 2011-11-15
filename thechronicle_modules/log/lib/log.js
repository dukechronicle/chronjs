var winston = require('winston');
var config = require('../../config');

var logger = null;
if (!logger) {
    logger = new (winston.Logger)();

    logger.setLevels(winston.config.syslog.levels);
    logger.add(winston.transports.Console, {
    level: 'debug',
    handleExceptions: true
    });

    if (process.env.NODE_ENV === 'production')
        logger.add(winston.transports.Loggly,
            {
                subdomain: "thechronicle",
                inputToken: "4d40e1e2-ef31-491f-b844-8b83aa38b30c",
                level: 'warning',
                json: true,
                handleExceptions: true
            }
        );

    logger.handleExceptions();
    logger.info('Logger is up');

    // TODO: Handle logging errors with email alert
    logger.on('error', function(err) {
        console.error("Logging error: " + JSON.stringify(err));
    });
}

logger.extend(exports);
