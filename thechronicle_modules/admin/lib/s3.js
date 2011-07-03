var s3 = {};
var exports = module.exports = s3;

var knox = require('knox');
var fs = require('fs');
var BUCKET_NAME = 'alga';

s3.put = function(buf, key, type, callback) {
    _getClient(function(err, client) {
        var req = client.put(key, {
            'Content-Length': buf.length,
            'Content-Type': type
        });
        req.on('response', function(res) {
            if (200 == res.statusCode) callback(null, req.url);
            else callback(res, null);
        });
        req.end(buf);
    });
}

//reading access keys from file for now...
function _getClient(callback) {
    fs.readFile('ak.txt',
    function(err, data) {
        var parts = data.toString('utf8').split(',')
        var client = knox.createClient({
            key: parts[0],
            secret: parts[1],
            bucket: BUCKET_NAME
        });
        callback(null, client);
    });
}
/*
fs.readFile('README.md', function(err, buf) {
    s3.put(buf, 'README.md', 'text/plain', function(err, res) {
        console.log(res);
    });
});
*/
