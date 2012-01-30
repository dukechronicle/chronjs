var sitemap = exports;

var async = require('async');
var builder = require('xmlbuilder');
var dateFormat = require('dateformat');
var db = require('../../db-abstract');
var fs = require('fs');
var log = require('../../log');
var _ = require('underscore');


sitemap.latestSitemap = function (path, callback) {
    latestSitemap(path, {}, false, callback);
};

sitemap.latestNewsSitemap = function (path, callback) {
    var query = { startkey: (new Date()).getTime() / 1000 - 2 * 24 * 60 * 60 };
    latestSitemap(path, query, true, callback);
};

function latestSitemap(path, query, news, callback) {
    db.view("articles/all_by_date", query, function(err, results) {
        if (err) callback(err);
	else {
	    results = _.map(results, function (doc) { return doc.value; });
	    generateSitemap(results, news, function (err, xml) {
		if (err) callback(err);
		else fs.writeFile(path, xml, callback);
	    });
	}
    });
};

function generateSitemap(docs, news, callback) {
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
		      var url = root.ele('url');
		      url.ele('loc', prefix + _.last(doc.urls)).up().
			  ele('lastmod', date).up().
			  ele('changefreq', 'never').up().
			  ele('priority', '0.5').up();
		      if (news)
			  url.ele('news:news').
			  ele('news:publication').
			  ele('news:name', 'The Chronicle').up().
			  ele('news:language', 'en').up().up().
			  ele('news:publication_date', date).up().
			  ele('news:title', doc.title);
		      cb();
		  },
		  function (err) {
		      callback(err, doc.toString());
		  });
}

function getDate(doc) {
    var date = doc.updated || doc.created;
    if (date === undefined)
	return undefined;
    return dateFormat(new Date(date * 1000), "yyyy-mm-dd");
}