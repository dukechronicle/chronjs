var config = require("../../config");

var ADMIN_ACCOUNT_TYPE = 'admin';
var DEFAULT_USERNAME = 'admin';
var DEFAULT_PASSWORD = 'chronicle';

var accounts = exports;

function login(req,accountType,callback) {
    // prevent session fixation by doing a logout    
    accounts.logOut(req, function(err) {
        if(err) return callback(err);
        
        req.session.account.isLoggedIn = true;
        req.session.account.accountType = accountType;
        return callback(null);
    });
}

accounts.isAdmin = function(req) {
    req.session = req.session || {};
    req.session.account = req.session.account || {};    
    return (req.session.account.isLoggedIn == true && req.session.account.accountType == ADMIN_ACCOUNT_TYPE);
}

accounts.login = function(req,username,password,callback) {
    var adminUsername = config.get('ADMIN_USERNAME') || DEFAULT_USERNAME;
    var adminPassword = config.get('ADMIN_PASSWORD') || DEFAULT_PASSWORD;

    if(adminUsername == username && adminPassword == password)
    {
        login(req,ADMIN_ACCOUNT_TYPE,callback);
    }
    else {
        var err = 'Invalid Username / Password Combination';
        return callback(err);
    }
}

accounts.logOut = function(req, callback) {
    req.session.regenerate(function(err) {
        req.session.account = {};
        return callback(err);
    });
}
