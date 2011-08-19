var config = require("../../config");

var ADMIN_ACCOUNT_TYPE = 'admin';
var DEFAULT_USERNAME = 'admin';
var DEFAULT_PASSWORD = 'chronicle';

var accounts = exports;

function login(session,accountType) {
	accounts.logOut();

	session.isLoggedIn = true;
	session.accountType = accountType;
}

accounts.isAdmin = function(session) {
	return (session.isLoggedIn == true && session.accountType == ADMIN_ACCOUNT_TYPE);
}

accounts.login = function(session,username,password,callback) {
	var adminUsername = config.get('ADMIN_USERNAME') || DEFAULT_USERNAME;
	var adminPassword = config.get('ADMIN_PASSWORD') || DEFAULT_PASSWORD;
	var err = null;

	if(adminUsername == username && adminPassword == password)
	{
		login(session,ADMIN_ACCOUNT_TYPE);
	}
	else {
		err = 'Invalid Username / Password Combination';
	}

	callback(err);
}

accounts.logOut = function(session) {
	session = {};
}
