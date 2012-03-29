var sitemap = exports;

var async = require('async');
var builder = require('xmlbuilder');
var child_process = require('child_process');
var dateFormat = require('dateformat');
var fs = require('fs');
var log = require('../../log');
var _ = require('underscore');
var api = require('../../api');
var config = require("../../config");

var SITEMAP_URL_LIMIT = 10000;


sitemap.generateAllSitemaps = function (callback) {
    async.parallel([
	function (cb) {
	    sitemap.latestFullSitemap('public/sitemaps/sitemap', function (err) {
		if (err) log.warning("Couldn't build full sitemap: " + err);
		cb(err);
	    });
	},
	function (cb) {
	    sitemap.latestNewsSitemap('public/sitemaps/news_sitemap', function (err) {
		if (err) log.warning("Couldn't build news sitemap: " + err);
		cb(err);
	    });
	}], callback);
};

sitemap.latestFullSitemap = function (path, callback) {
    latestFullSitemapHelper(path, 0, null, [], function (err, files) {
        if (files) {
            child_process.exec('gzip -f ' + files.join(' '), function (err) {
                if (err) callback("Couldn't zip sitemap files: " + err);
                else generateSitemapIndex(files, new Date(), function (err, xml) {
                if (err) callback(err);
                else fs.writeFile(path + '.xml', xml, callback);
                });
            });
        }
    });
};

sitemap.latestNewsSitemap = function (path, callback) {
    var query = { endkey: (new Date()).getTime() / 1000 - 2 * 24 * 60 * 60 };
    latestSitemap(path + ".xml", query, true, callback);
};

function latestFullSitemapHelper(path, number, start, files, callback) {
    var query = {};
    if (start != null) {
	query.startkey = start;
	query.skip = 1;
    }
    latestSitemap(path + number + ".xml", query, false,
      function (err, numresults, lastkey) {
          if (err) callback(err);
          else if (numresults == SITEMAP_URL_LIMIT) {
              files.push(path + number + ".xml");
              latestFullSitemapHelper(path, number+1, lastkey, files, callback);
          } else {
              files.push(path + number + ".xml");
              callback(null, files);
          }
      });
}

function latestSitemap(path, query, news, callback) {
    api.docsByDate(SITEMAP_URL_LIMIT, query, function(err, results) {
        if (err) callback(err);
        else if (results.length == 0) callback("No new articles for sitemap");
	else {
	    var lastkey = _.last(results).key;
	    _.each(results, function (doc) {
		delete doc.body;
	    });
	    generateSitemap(results, news, function (err, xml) {
		if (err) callback(err);
		else fs.writeFile(path, xml, function (err) {
		    callback(err, results.length, lastkey);
		});
	    });
	}
    });
}

function generateSitemapIndex(files, date, callback) {
   var doc = builder.create();
    var root = doc.begin("sitemapindex", { version: "1.0", encoding: "UTF-8" }).
	att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");
    async.forEach(files,
		  function (path, cb) {
		      var prefix = "http://www." + config.get('DOMAIN_NAME') + "/";
		      root.ele("sitemap").
			    ele("loc", prefix + path.replace(/public\//g,"") + ".gz").up().
			    ele("lastmod", dateFormat(date, "yyyy-mm-dd"));
		      cb();
		  },
		  function (err) {
		      callback(err, doc.toString());
		  });
}

function generateSitemap(docs, news, callback) {
    var doc = builder.create();
    var root = doc.begin("urlset", { version: "1.0", encoding: "UTF-8" }).
	att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");
    if (news)
	root.att("xmlns:news", "http://www.google.com/schemas/sitemap-news/0.9");
    async.forEach(docs,
		  function (doc, cb) {
		      var prefix = "http://www." + config.get('DOMAIN_NAME') + "/article/";
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
