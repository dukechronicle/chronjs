/* require internal modules */
var config = require('../thechronicle_modules/config');
var api = require('../thechronicle_modules/api/lib/api');

var async = require('async');

if(!config.isSetUp()) {
	console.log('You must set up config.js in the main directory before you can generate an environment');
}
else {
    api.init(function(err) {
        if (err) console.log(err);
        else {
            console.log('environment created');
        }
    });
}
