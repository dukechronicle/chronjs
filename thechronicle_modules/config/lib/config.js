var configFile = require('../../../config.js');
var globalFunctions = require('../../global-functions');

var configuration = configFile.getConfiguration();
var activeProfile = configuration.profiles[configuration.activeConfigurationProfile];

if(activeProfile == null) {
	if(configuration.activeConfigurationProfile == null) globalFunctions.log('Active configuration profile is not defined!');
	else globalFunctions.log('Configuration profile: "' + configuration.activeConfigurationProfile + '" does not exist!');
}

exports.get = function(variable) {
	if(activeProfile[variable] == null) globalFunctions.log('Configuration property: "' + variable + '" not defined!');
	return activeProfile[variable];
};
