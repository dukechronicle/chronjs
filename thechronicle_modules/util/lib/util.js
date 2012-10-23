var dateFormat = require('dateformat');
var fs = require('fs');
var http = require('http');
var urlModule = require('url');
var _ = require('underscore');

var log = require('../../log/lib/log');

var util = module.exports = require('util');

util.cache = require("./cache");

util.unixTimestamp = function (date) {
    date = date || new Date();
    return Math.round(date.getTime() / 1000);
};

util.formatTimestamp = function (timestamp, format) {
    var date = new Date(timestamp*1000);
    return format ? dateFormat(date, format) : date;
};

util.randomString = function (length) {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var randomstring = '';
    for (var i=0; i< length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
};

util.trim = function (string) {
    return string.replace(/^\s*|\s*$/g, '')
};

util.downloadUrlToPath = function (url, path, callback) {
    var urlObj = urlModule.parse(url);
    log.info('host: ' + urlObj.host);
    var options = {
        host: urlObj.host,
        port: 80,
        path: urlObj.pathname
    };
    http.get(options, function(res) {
        res.setEncoding('binary');
        var data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            fs.writeFile(path, data, 'binary', function(err) {
                callback(err);
            });
        });
    });
}

util.capitalizeWords = function(str) {
    return str.replace(/(^|\s)([a-z])/g , function(m, p1, p2) {
        return p1+p2.toUpperCase();
    });;
}
