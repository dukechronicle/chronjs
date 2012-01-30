var builder = require('xmlbuilder');
var log = require('../../log');


exports.googleNewsSitemap = function (path, docs, callback) {
    var doc = builder.create();
    doc.begin("urlset", { version: "1.0", encoding: "UTF-8" }).
	att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9").
	att("xmlns:news", "http://www.google.com/schemas/sitemap-news/0.9");
    log.debug(doc.toString({ pretty: true }));
};