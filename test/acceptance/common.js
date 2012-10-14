global.server = require('../../server');

global.Browser = require('zombie');
global.sinon = require('sinon')
global.chai = require('chai');
global.should = chai.should();
global.expect = chai.expect;

chai.use(require('sinon-chai'));

global.fullUrl = function (subdomain, path) {
    var port = process.env.PORT || 4000;
    return "http://" + subdomain + ".localhost:" + port + path;
}
