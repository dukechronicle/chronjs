var api = require('../../api');
var log = require('../../log');


exports.show = function (req, res, next) {
    api.sitemap.getSitemap(req.params.id, function (err, buffer) {
        if (err) res.send(500);
        else {
            res.end(buffer.toString('binary'));
        }
    });
};
