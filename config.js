exports.getConfiguration = function()
{
	try {
		return configuration;
	}
	catch(err) {
		return null;
	}
} 
