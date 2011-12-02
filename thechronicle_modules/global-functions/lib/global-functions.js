var urlModule = require('url');
var log = require('../../log');
var http = require('http');
var fs = require('fs');

exports.showError = function (res, message) {
    res.render('error', {
        locals: {
            message: message
        }
    });
};

exports.log = function (message){
    console.log(message);
};

exports.randomString = function (length) {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var randomstring = '';
    for (var i=0; i< length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
};

exports.trim = function (string) {
    return string.replace(/^\s*|\s*$/g, '')
};

exports.sendJSONResponse = function(res,jsonObject) {
    var jsonString = JSON.stringify(jsonObject);
    
    res.render('json', {
            locals: {
                  json: jsonString
               },
        layout: false
        });
};

exports.downloadUrlToPath = function (url, path, callback) {
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

