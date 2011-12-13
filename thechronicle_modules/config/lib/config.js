var configParams = require('./config-params.js');

var _ = require('underscore');
var cradle = require('cradle');
var url = require('url');
var log = require('../../log');

var DEFAULT_PROFILE_NAME = "dev";
var PROFILE_NAME_KEY = "profile_name";
var DB_CONFIG_DOCUMENT_NAME = "configProfiles";

var configuration = null;
var activeProfile = null;
var configFile = null;
var activeProfileName = null;
var configDB = null; 
var documentExistsInDB = false;

exports.init = function(callback)
{
    configDB = _connectToConfigDB();

    configDB.get(DB_CONFIG_DOCUMENT_NAME, function(err, data) {
        if(err) callback(err);        

        // config info hasn't been created yet
        if(data != null) {
            documentExistsInDB = true;

            configuration = data;
            activeProfileName = 'dev'; // should be in env var
            activeProfile = configuration.profiles[activeProfileName];

            if(activeProfile == null) {
                log.alert('Configuration profile: "' + activeProfileName + '" does not exist!');
            }
        }
        callback(null);
    });
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
    // remove configuration profile name from parameter set as it is not a configuration parameter
    var profileName = params[PROFILE_NAME_KEY];
    delete params[PROFILE_NAME_KEY];

    // build the configuration object if needed
    if (configuration == null) configuration = {};
    if (configuration.profiles == null) configuration.profiles = {};
    if (configuration.profiles[profileName] == null) configuration.profiles[profileName] = {};

    Object.keys(params).forEach(function (key) {
        if (params[key].length > 0) {
            if(typeof getConfigParamObjectWithName(key).defaultValue == "object") {
                try {
                    configuration.profiles[profileName][key] = JSON.parse(params[key]);
                }
                catch(err) {
                    log.alert('Config param ' + key + ' defined as improper JSON. Ignoring changes.');
                    configuration.profiles[profileName][key] = activeProfile[key];
                }
            }
            else {
                configuration.profiles[profileName][key] = params[key];
            }
        }
    });

    activeProfileName = profileName;
    activeProfile = configuration.profiles[activeProfileName];

    var afterUpdate = function(err, res) {
        if (err) return callback(err);
        if (exports.getUndefinedParameters().length == 0) return callback(null);
        else return callback('some parameters still undefined');
    }

    // save the config file
    if(documentExistsInDB) {
        configDB.merge(DB_CONFIG_DOCUMENT_NAME, {profiles:configuration.profiles}, afterUpdate);
    }   
    else {
        configDB.save(DB_CONFIG_DOCUMENT_NAME, configuration, afterUpdate);
    }
};

exports.getUndefinedParameters = function () {
    if (configuration == null || activeProfile == null) return configParams.getParameters();

    var parameters = configParams.getParameters();

    // find the undefined params and return them
    var undefinedParameters = _.filter(parameters, function (parameter) {
        return activeProfile[parameter.name] == null;
    });

    if (undefinedParameters.length > 0) log.warning("Undefined parameters: " + JSON.stringify(undefinedParameters));
    return undefinedParameters;
};

exports.getParameters = function () {
    if(configuration == null || activeProfile == null) return configParams.getParameters();
    
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

function _connectToConfigDB() {
    var couchdbUrl = "https://jodoglevy:vfr46yhn@jodoglevy.cloudant.com" // should be in env var
    
    couchdbUrl = url.parse(couchdbUrl);
    if (couchdbUrl.auth) {
        couchdbUrl.auth = couchdbUrl.auth.split(":");
    }

    if (!couchdbUrl.port) {
        (couchdbUrl.protocol === "https:") ? couchdbUrl.port = 443 : couchdbUrl.port = 80;
    }
    
    var conn = new (cradle.Connection)(couchdbUrl.protocol + '//' + couchdbUrl.hostname, couchdbUrl.port, {
        auth: {username: couchdbUrl.auth[0], password: couchdbUrl.auth[1]}
    }); 
    
    return conn.database('config'); // should be in env var
}
