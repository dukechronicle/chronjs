var config = exports;

var configParams = require('./config-params.js');

var _ = require('underscore');
var validator = require("JSV").JSV.createEnvironment();
var db = require('../../db-abstract');
var url = require('url');
var log = require('../../log');

var PROFILE_NAME = process.env.CHRONICLE_CONFIG_PROFILE || "dev";
var DB_CONFIG_DOCUMENT_NAME = "config";
var COUCHDB_CONFIG_HOST = process.env.CHRONICLE_CONFIG_DB;
var DOCUMENT_CONFIG_KEY = "configParams";
var CONFIG_DB_NAME_SUFFIX = "-config-profile";

// the keys that the config profile name and revision should by keyed to in the params object passed into config.setUp()
var PROFILE_NAME_KEY = "profile_name";
var REVISION_KEY = "rev";

var configProfile = null;
var configDB = null; 
var documentExistsInDB = false;
var configRevision = null;

var afterConfigChangeFunction = function(callback) { callback(); };

config.runAfterConfigChangeFunction = function(callback) {
    afterConfigChangeFunction(callback);
};

config.init = function(func, callback)
{
    if (!COUCHDB_CONFIG_HOST)
        return callback('No config database defined! Please set your ' +
                        'CHRONICLE_CONFIG_DB environment var to the CouchDB ' +
                        'host that stores site config info');


    afterConfigChangeFunction = func;
    
    log.info("Connecting to config database '" + PROFILE_NAME + "'");
    configDB = db.connect(COUCHDB_CONFIG_HOST,
                          PROFILE_NAME + CONFIG_DB_NAME_SUFFIX);

    configDB.exists(function (err, exists) {
        if (err) return callback(error);
       
        // initialize database if it doesn't already exist
        if (!exists) {
            log.notice("Database for config profile '" + PROFILE_NAME +
                       "' does not exist. Creating...");
            configDB.create(function(err, response) {
                if (err) callback(err);
                else getConfig(callback);
            });
        }
        else {
            getConfig(callback);
        }  
    });
}

function getConfig(callback) {
    configDB.get(DB_CONFIG_DOCUMENT_NAME, function(err, data) {
        // err if the document doesn't exist yet 
        if(!err) {
            documentExistsInDB = true;
            configProfile = data[DOCUMENT_CONFIG_KEY];
            configRevision = data._rev;
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

config.checkForUpdatedConfig = function(callback) {
    var prevRev = configRevision;
    getConfig(function() {
        callback(prevRev != configRevision);
    });
}

config.get = function(variable) {
    if (!configProfile) {
        log.alert('Configuration is not defined!');
        return null;
    }
    else if (variable in configProfile) {
        // return a deep copy of the parameter
        return JSON.parse(JSON.stringify(configProfile[variable]));
    }

    var param = getConfigParamObjectWithName(variable);
    if (!param)
        log.warning('Unknown configuration property: "' + variable + '"');
    else if (param.schema.required)
        log.warning('Configuration property: "' + variable + '" not defined!');
    return null;
};

config.isSetUp = function () {
    return config.getUndefinedParameters().length == 0; // if all config params are defined, it is set up
};

config.setConfigProfile = function (params, callback) {
    configProfile = _.extend(configProfile || {}, params);

    var newInfo = {};
    newInfo[DOCUMENT_CONFIG_KEY] = configProfile;

    // save the config file
    if (documentExistsInDB) {
        configDB.merge(DB_CONFIG_DOCUMENT_NAME, newInfo, callback);
    }
    else {
        configDB.save(DB_CONFIG_DOCUMENT_NAME, newInfo, callback);
    }
};

config.setUp = function (params, callback) {
    var jsonError = null;
        
    if(params[REVISION_KEY] !== configRevision && configRevision != null) {
        return callback('The configuration changed since you loaded the config page. Try again.');
    }

    // remove configuration profile name and config revision from parameter set as they are not configuration parameters
    delete params[PROFILE_NAME_KEY];
    delete params[REVISION_KEY];

    // build the configuration object if needed
    if (configProfile == null) configProfile = {};

    Object.keys(params).forEach(function (key) {
        if (params[key].length > 0) {
            var configParamObj = getConfigParamObjectWithName(key);
            
            if(typeof configParamObj.defaultValue == "object") {
                try {
                        params[key] = JSON.parse(params[key]);
                }
                catch(err) {
                    if(jsonError == null) jsonError = "";
                    else jsonError += "<br />";

                    jsonError += 'Config param ' + key + ' defined as improper JSON. Ignoring changes to ' + key + '.';
                }
            }

            var report = validator.validate(params[key], configParamObj.schema);
            if (report.errors.length === 0) {
                //JSON is valid against the schema
                configProfile[key] = params[key];
            }
            else {
                if(jsonError == null) jsonError = "";
                else jsonError += "<br />";

                jsonError += 'Config param ' + key + ' defined incorrectly according to schema. Ignoring changes to ' + key + '.';
                jsonError += '<br />' + key + ' errors:<br />' + JSON.stringify(report.errors) + '<br />';
            }
        }
    });

    var afterUpdate = function(err, res) {
        if (err) return callback(err);
        if (jsonError) return callback(jsonError);
        
        configRevision = res.rev;
        documentExistsInDB = true;
        if (config.getUndefinedParameters().length == 0) return callback(null);
        else return callback('Some parameters still undefined. Please define all parameters.');
    }

    config.setConfigProfile(configProfile, afterUpdate);
};

config.getUndefinedParameters = function () {
    if (configProfile == null) return configParams.getParameters();

    var allParameters = configParams.getParameters();
    var undefinedParameters = _.reject(allParameters, function (parameter) {
        return (parameter.name in configProfile) || !parameter.schema.required;
    });

    if (undefinedParameters.length > 0)
        log.warning("Undefined parameters: " +
                    JSON.stringify(undefinedParameters));

    return undefinedParameters;
};

config.getParameters = function () {
    var params = [];
    _.each(configParams.getParameters(), function (parameter) {
        if (configProfile && (parameter.name in configProfile)) {
            parameter.defaultValue = configProfile[parameter.name];
            params.push(parameter);
        }
        else params.unshift(parameter);
    });
    return params;
};

config.getActiveProfileName = function() {
    return PROFILE_NAME;
};

config.getProfileNameKey = function() {
    return PROFILE_NAME_KEY;
};

config.getRevisionKey = function() {
    return REVISION_KEY;
};

config.getConfigRevision = function() {
    return configRevision;
};
