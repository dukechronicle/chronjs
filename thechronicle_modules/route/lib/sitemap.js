var api = require('../../api');


exports.full = function (req, res, next) {
    api.sitemap.getFullSitemap(req.params.id, function (err, xml) {
        if (err) res.send(500);
        else {
            res.header('Content-Encoding', 'gzip');
            res.send(xml);
        }
    });
};

exports.news = function (req, res, next) {
    api.sitemap.getNewsSitemap(req.params.id, function (err, xml) {
        if (err) res.send(500);
        else {
            res.header('Content-Encoding', 'gzip');
            res.send(xml);
        }
    });
};
