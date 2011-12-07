var configParams = require('./config-params.js');

var fs = require('fs');
var _ = require('underscore');
var log = require('../../log');

var CONFIG_FILE_PATH = "./config.js";
var DEFAULT_PROFILE_NAME = "production";
var PROFILE_NAME_KEY = "profile_name";

var configuration = null;
var activeProfile = null;
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
        if(configuration.activeConfigurationProfile == null) {
            log.alert('Active configuration profile is not defined!');
        } else {
            log.alert('Configuration profile: "' + configuration.activeConfigurationProfile + '" does not exist!');
        }
    }
}

function getConfigParamObjectWithName(name) {
    var params = configParams.getParameters();

    for(var i = 0; i < params.length; i ++) {
        if(params[i].name === name) return params[i];
    }

    return null;
}

exports.get = function(variable) {
    if(activeProfile == null) {
        log.alert('Configuration is not defined!');
        return null;
    }

    if(activeProfile[variable] == null) {
        log.alert('Configuration property: "' + variable + '" not defined!');
    }

    if(typeof activeProfile[variable] == "object") return _.extend({}, activeProfile[variable]);
    else return activeProfile[variable];
};

exports.isSetUp = function () {
    return exports.getUndefinedParameters().length == 0; // if all config params are defined, it is set up
};

exports.setUp = function (params, callback) {
    var addToConfigFile = "exports.getConfiguration = function(){try {return configuration;}catch(err) {return null;}}";

    // remove configuration profile name from parameter set as it is not a configuration parameter
    var profileName = params[PROFILE_NAME_KEY];
    delete params[PROFILE_NAME_KEY];

    // build the configuration object if needed
    if (configuration == null) configuration = {};
    if (configuration.profiles == null) configuration.profiles = {};
    if (configuration.profiles[profileName] == null)    configuration.profiles[profileName] = {};

    configuration.activeConfigurationProfile = profileName;

    Object.keys(params).forEach(function (key) {
        if (params[key].length > 0) {
            configuration.profiles[configuration.activeConfigurationProfile][key] = params[key];
        }
    });

    activeProfileName = configuration.activeConfigurationProfile;
    activeProfile = configuration.profiles[activeProfileName];

    // write the config file
    var writeToFile = 'var configuration = \n' + JSON.stringify(configuration, null, 4) + ';\n\n' + addToConfigFile;
    fs.writeFile(CONFIG_FILE_PATH, writeToFile, function (err) {
        if (err) return callback(err);
        if (exports.getUndefinedParameters().length == 0) return callback(null);
        else return callback('some parameters still undefined');
    });
};

exports.getUndefinedParameters = function () {
    if (configuration == null) return configParams.getParameters();

    var parameters = configParams.getParameters();

    // find the undefined params and return them
    var undefinedParameters = _.filter(parameters, function (parameter) {
        return activeProfile[parameter.name] == null;
    });

    if (undefinedParameters.length > 0) log.warning("Undefined parameters: " + JSON.stringify(undefinedParameters));
    return undefinedParameters;
};

exports.getParameters = function () {
    if(configuration == null) return configParams.getParameters();
    
    var returnParams = exports.getUndefinedParameters();

    Object.keys(activeProfile).forEach(function(key) {
        var defaultParameter = {};
        defaultParameter.name = key;
        defaultParameter.description = getConfigParamObjectWithName(key).description;
        defaultParameter.defaultValue = activeProfile[key];
        returnParams.push(defaultParameter);
    });

    return returnParams;
};

exports.getActiveProfileName = function() {
    return activeProfileName || DEFAULT_PROFILE_NAME;
};

exports.getProfileNameKey = function() {
    return PROFILE_NAME_KEY;
};
