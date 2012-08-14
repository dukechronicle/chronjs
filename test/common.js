var async = require('async');
var config = require('../thechronicle_modules/config');
var api = require('../thechronicle_modules/api');

global.sinon = require('sinon');
global.chai = require('chai');
global.should = require('chai').should();
global.expect = require('chai').expect;
global.AssertionError = require('chai').AssertionError;

global.swallow = function (thrower) {
    try {
        thrower();
    } catch (e) { }
};

// TODO: config and db should be mocked out.
global.init = function (callback) {
    async.waterfall([
        function (callback) {
            config.init(null, callback);
        },
        function (callback) {
            if (config.isSetUp()) {
                api.init(callback);
            }
            else {
                callback("Configuration is not set up. Cannot continue.");
            }
        },
    ], callback);
};

var sinonChai = require('sinon-chai');
chai.use(sinonChai);
