var configParams = require('./config-params.js');
var globalFunctions = require('../../global-functions');

var fs = require('fs');

var CONFIG_FILE_PATH = "./config.js";
var DEFAULT_PROFILE_NAME = "production";
var PROFILE_NAME_KEY = "profile_name";

var configuration = null;
var activieProfile = null;
var configFile = null;
var activeProfileName = null;

initConfig();	

function initConfig()
{
	try {
		configFile = require('../../../config.js');
	}
	catch(err) {
		// config file hasn't been created yet so try to make the config info accessible
		return;
	}

	configuration = configFile.getConfiguration();
	activeProfileName = configuration.activeConfigurationProfile;
	activeProfile = configuration.profiles[activeProfileName];

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
	return exports.getUndefinedParameters().length == 0; // if all config params are defined, it is set up
}

exports.setUp = function(params, callback) {
	var addToConfigFile = "exports.getConfiguration = function(){try {return configuration;}catch(err) {return null;}}"; 	
	
	// remove configuration profile name from parameter set as it is not a configuration parameter	
	var profileName = params[PROFILE_NAME_KEY];
	delete params[PROFILE_NAME_KEY];

	// build the configuration object if needed
	if(configuration == null) configuration = {};
	if(configuration.profiles == null) configuration.profiles = {};
	if(configuration.profiles[profileName] == null)	configuration.profiles[profileName] = {};
	
	configuration.activeConfigurationProfile = profileName;	

	for(configKey in params) {
		if(params[configKey].length > 0) {
			configuration.profiles[configuration.activeConfigurationProfile][configKey] = params[configKey];
		}
	}
	
	activeProfileName = configuration.activeConfigurationProfile;
	activeProfile = configuration.profiles[activeProfileName];

	// write the config file
	var writeToFile = 'var configuration = \n'+ JSON.stringify(configuration) + ';\n\n' + addToConfigFile;
	fs.writeFile(CONFIG_FILE_PATH, writeToFile, function(err) {
		if(exports.getUndefinedParameters().length == 0) callback(null);
		else callback('some parameters still undefined');
	});
}

exports.getUndefinedParameters = function() {
	if(configuration == null) return configParams.getParameters();

	var parameters = configParams.getParameters();
	var returnParameters = [];

	// find the undefined params and return them
	for(i = 0; i < parameters.length; i ++) {
		// if a parameter is undefined, add it to return array
		if(activeProfile[parameters[i].name] == null) returnParameters.push(parameters[i]); 
	}

	return returnParameters;
}

exports.getActiveProfileName = function() {
	return activeProfileName || DEFAULT_PROFILE_NAME;
}

exports.getProfileNameKey = function() {
	return PROFILE_NAME_KEY;
}
