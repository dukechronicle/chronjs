var sitemap = exports;

var async = require('async');
var builder = require('xmlbuilder');
var dateFormat = require('dateformat');
var db = require('../../db-abstract');
var log = require('../../log');
var _ = require('underscore');


sitemap.googleNewsSitemap = function (path, docs, callback) {
    var doc = builder.create();
    var root = doc.begin("urlset", { version: "1.0", encoding: "UTF-8" }).
	att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9").
	att("xmlns:news", "http://www.google.com/schemas/sitemap-news/0.9");
    async.forEach(docs,
		  function (doc, cb) {
		      // TODO: extract domain name
		      var prefix = "http://www.dukechronicle.com/article/";
		      var date = getDate(doc);
		      if (date === undefined) return cb(err);
		      root.ele('url').
			  ele('loc', prefix + _.last(doc.urls)).up().
			  ele('lastmod', date).up().
			  ele('changefreq', 'never').up().
			  ele('priority', '0.5').up();
		      cb();
		  },
		  function (err) {
		      log.debug(doc.toString({ pretty: true }));
		  });
};

sitemap.latestGoogleSitemap = function (path, callback) {
    var query = { startkey: (new Date()).getTime() / 1000 - 2 * 24 * 60 * 60 };
    db.view("articles/all_by_date", query, function(err, results) {
        if (err) callback(err);
	else {
	    results = _.map(results, function (doc) { return doc.value; });
	    sitemap.googleNewsSitemap(path, results, callback);
	}
    });
};

function getDate(doc) {
    var date = doc.updated || doc.created;
    if (date === undefined)
	return undefined;
    return dateFormat(new Date(date * 1000), "yyyy-mm-dd");
}