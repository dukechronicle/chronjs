var configParams = require('./config-params.js');

var _ = require('underscore');
var db = require('../../db-abstract');
var url = require('url');
var log = require('../../log');

var PROFILE_NAME = process.env.CHRONICLE_CONFIG_PROFILE || "dev";
var DB_CONFIG_DOCUMENT_NAME = "config";
var COUCHDB_CONFIG_HOST = process.env.CHRONICLE_CONFIG_DB;
var DOCUMENT_CONFIG_KEY = "configParams";
var CONFIG_DB_NAME_SUFFIX = "-config-profile";

// the keys that the config profile name and revision should by keyed to in the params object passed into exports.setUp()
var PROFILE_NAME_KEY = "profile_name";
var REVISION_KEY = "rev";

var configProfile = null;
var configDB = null; 
var documentExistsInDB = false;
var configRevision = null;

exports.init = function(callback)
{
    if(!COUCHDB_CONFIG_HOST) return callback('No config database defined! Please set your CHRONICLE_CONFIG_DB environment var to the CouchDB host that stores site config info');
    
    log.info("Connecting to config database '" + PROFILE_NAME + "'");
    configDB = db.connect(COUCHDB_CONFIG_HOST,PROFILE_NAME+CONFIG_DB_NAME_SUFFIX);

    configDB.exists(function (error,exists) {
        if(error) return callback(error);
       
        // initialize database if it doesn't already exist
        if(!exists) {
            log.alert("Database for config profile '" + PROFILE_NAME + "' does not exist. Creating...");
            configDB.create();
            db.whenDBExists(configDB,function() {
                getConfig(callback);
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

exports.get = function(variable) {
    if(configProfile == null) {
        log.alert('Configuration is not defined!');
        return null;
    }

    if(configProfile[variable] == null) {
        log.alert('Configuration property: "' + variable + '" not defined!');
    }

    if(typeof configProfile[variable] == "object") return _.extend({}, configProfile[variable]);
    else return configProfile[variable];
};

exports.isSetUp = function () {
    return exports.getUndefinedParameters().length == 0; // if all config params are defined, it is set up
};

exports.setUp = function (params, callback) {
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
            if(typeof getConfigParamObjectWithName(key).defaultValue == "object") {
                try {
                    configProfile[key] = JSON.parse(params[key]);
                }
                catch(err) {
                    if(jsonError == null) jsonError = "";
                    else jsonError += "<br />";

                    jsonError += 'Config param ' + key + ' defined as improper JSON. Ignoring changes to ' + key + '.';
                }
            }
            else {
                configProfile[key] = params[key];
            }
        }
    });

    var afterUpdate = function(err, res) {
        if (err) return callback(err);
        if (jsonError) return callback(jsonError);
        
        configRevision = res.rev;
        documentExistsInDB = true;
        if (exports.getUndefinedParameters().length == 0) return callback(null);
        else return callback('Some parameters still undefined. Please define all parameters.');
    }

    var newInfo = {};
    newInfo[DOCUMENT_CONFIG_KEY] = configProfile;

    // save the config file
    if(documentExistsInDB) {
        configDB.merge(DB_CONFIG_DOCUMENT_NAME, newInfo, afterUpdate);
    }   
    else {
        configDB.save(DB_CONFIG_DOCUMENT_NAME, newInfo, afterUpdate);
    }
};

exports.getUndefinedParameters = function () {
    if (configProfile == null) return configParams.getParameters();

    var parameters = configParams.getParameters();

    // find the undefined params and return them
    var undefinedParameters = _.filter(parameters, function (parameter) {
        return configProfile[parameter.name] == null;
    });

    if (undefinedParameters.length > 0) log.warning("Undefined parameters: " + JSON.stringify(undefinedParameters));
    return undefinedParameters;
};

exports.getParameters = function () {
    if(configProfile == null) return configParams.getParameters();
    
    var returnParams = exports.getUndefinedParameters();

    Object.keys(configProfile).forEach(function(key) {
        var configParam = getConfigParamObjectWithName(key);
        
        if(configParam != null) {
            configParam.defaultValue = configProfile[key];
            returnParams.push(configParam);
        }
    });

    return returnParams;
};

exports.getActiveProfileName = function() {
    return PROFILE_NAME;
};

exports.getProfileNameKey = function() {
    return PROFILE_NAME_KEY;
};

exports.getRevisionKey = function() {
    return REVISION_KEY;
};

exports.getConfigRevision = function() {
    return configRevision;
};
