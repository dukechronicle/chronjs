var configParams = require('./config-params.js');
var globalFunctions = require('../../global-functions');
var configFile = require('../../../config.js');

var fs = require('fs');

var CONFIG_FILE_PATH = "./config.js";

var configuration = null;
var activieProfile = null;
	
initConfig();	

function initConfig()
{
	configuration = configFile.getConfiguration();

	// if a configuration has not been created yet, return
	if(configuration == null) return;

	activeProfile = configuration.profiles[configuration.activeConfigurationProfile];

	if(activeProfile == null) {
		if(configuration.activeConfigurationProfile == null) globalFunctions.log('Active configuration profile is not defined!');
		else globalFunctions.log('Configuration profile: "' + configuration.activeConfigurationProfile + '" does not exist!');
	}
}

exports.get = function(variable) {
	if(activeProfile[variable] == null) globalFunctions.log('Configuration property: "' + variable + '" not defined!');
	return activeProfile[variable];
};

exports.isSetUp = function() {
	return configuration != null;
}

exports.setUp = function(params, callback) {
	// build the configuration object	
	configuration = {};
	configuration.activeConfigurationProfile = params.profile_name;
	configuration.profiles = {};
	configuration.profiles[params.profile_name] = {};

	// remove configuration profile name from parameter set as it is not a configuration parameter	
	delete params.profile_name;

	for(configKey in params) {
		configuration.profiles[configuration.activeConfigurationProfile][configKey] = params[configKey];
	}

	activeProfile = configuration.profiles[configuration.activeConfigurationProfile];

	fs.readFile(CONFIG_FILE_PATH, 'utf8', function(err, data) {

		var writeToFile = 'var configuration = \n'+ JSON.stringify(configuration) + ';\n\n' + data;
		fs.writeFile(CONFIG_FILE_PATH, writeToFile, function(err) {
			callback(null);
		});
	});
}

exports.getParameters = function() {
	return configParams.getParameters();
}
