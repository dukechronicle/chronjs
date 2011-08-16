var ADMIN_ACCOUNT_TYPE = 'admin';

var accounts = exports;

accounts.isAdmin = function(session) {
	return (session.isLoggedIn == true && session.accountType == ADMIN_ACCOUNT_TYPE);
}

accounts.login = function(session,username,password,callback) {
	// temporarily, login always succeeds. Needs to be changed

	session.isLoggedIn = true;
	session.accountType = ADMIN_ACCOUNT_TYPE;

	callback(null);
}

accounts.logOut = function(session) {
	delete session;
}
