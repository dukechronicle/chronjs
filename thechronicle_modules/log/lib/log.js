var winston = require('winston');
var config = require('../../config');
var _ = require('underscore');


var logger = new (winston.Logger)();
_.extend(exports, logger);

exports.init = function() {
	logger.setLevels(winston.config.syslog.levels);
	logger.add(winston.transports.Console, { level: 'debug' });

	if (process.env.NODE_ENV === 'production')
    	logger.add(winston.transports.Loggly, {
		subdomain: config.get('LOGGLY_SUBDOMAIN'),
		inputToken: config.get('LOGGLY_INPUT_KEY'),
		level: 'warning',
		json: true
    	});
    
	logger.handleExceptions();
	logger.warning('Logger is up');

	// TODO: Handle logging errors with email alert
	logger.on('error', function(err) {
    	console.error("Logging error: " + JSON.stringify(err));
	});	
};
