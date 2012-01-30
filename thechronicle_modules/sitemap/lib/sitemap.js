var sitemap = exports;

var async = require('async');
var builder = require('xmlbuilder');
var child_process = require('child_process');
var dateFormat = require('dateformat');
var db = require('../../db-abstract');
var fs = require('fs');
var log = require('../../log');
var _ = require('underscore');

var SITEMAP_URL_LIMIT = 50000;


sitemap.latestFullSitemap = function (path, callback) {
    latestFullSitemapHelper(path, 0, null, [], function (err, files) {
	child_process.exec('gzip ' + files.join(' '), function (err) {
	    if (err) callback("Couldn't zip sitemap files: " + err);
	    // else generateSitemapIndex();
	});
    });
};

sitemap.latestNewsSitemap = function (path, callback) {
    var query = { startkey: (new Date()).getTime() / 1000 - 2 * 24 * 60 * 60 };
    latestSitemap(path + ".xml", query, true, callback);
};

function latestFullSitemapHelper(path, number, start, files, callback) {
    var query = { limit: SITEMAP_URL_LIMIT };
    if (start != null) {
	query.startkey = start;
	query.skip = 1;
    }
    latestSitemap(path + number + ".xml", query, false,
		  function (err, numresults, lastkey) {
		      if (err)
			  callback(err);
		      else if (numresults == SITEMAP_URL_LIMIT) {
			  files.push(path + number + ".xml");
			  latestFullSitemapHelper(path, number+1, lastkey, files, callback);
		      }
		      else {
			  files.push(path + number + ".xml");
			  callback(null, files);
		      }
		  });
};

function latestSitemap(path, query, news, callback) {
    query = query || {};
    query.limit = query.limit || SITEMAP_URL_LIMIT;	
    db.view("articles/all_by_date", query, function(err, results) {
        if (err) callback(err);
	else {
	    var lastkey = _.last(results).key;
	    results = _.map(results, function (doc) { return doc.value; });
	    generateSitemap(results, news, function (err, xml) {
		if (err) callback(err);
		else fs.writeFile(path, xml, function (err) {
		    callback(err, results.length, lastkey);
		});
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