var sitemap = exports;

var async = require('async');
var builder = require('xmlbuilder');
var gzip = require('gzip');
var _ = require('underscore');

var api = require('../../api');
var config = require('../../config');
var db = require('../../db-abstract');
var log = require('../../log');
var util = require('../../util');

var sitemap = exports;

var SITEMAP_URL_LIMIT = 10000;
var NEWS_URL_LIMIT = 1000;


sitemap.generateFullSitemap = function (start, callback) {
    api.article.getByDate(SITEMAP_URL_LIMIT, start, function (err, results, next) {
        if (err) return callback(err);
        gzip(generateSitemap(results, false), function (err, buffer) {
            callback(err, buffer, next);
        });
    });
};

sitemap.generateNewsSitemap = function (start, callback) {

};

sitemap.getFullSitemap = function (callback) {

};

sitemap.getNewsSitemap = function (callback) {

};

sitemap.updateFullSitemap = function (callback) {
    var i = 0;
    var start = null;
    async.forEachSeries(docs, function (doc, callback) {
        sitemap.generateFullSitemap(start, function (err, buffer) {
            if (err) callback(err);
            db.sitemap.saveSitemap('full', i++, buffer, callback);
        }, callback);
    });
};

sitemap.updateNewsSitemap = function (callback) {

};

function generateSitemap(docs, news) {
    var document = builder.create();
    var root = document.begin("urlset", { version: "1.0", encoding: "UTF-8" }).
        att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");
    if (news) {
        root.att("xmlns:news", "http://www.google.com/schemas/sitemap-news/0.9");
    }

    _.each(docs, function (doc) {
        var prefix = "http://www" + config.get('DOMAIN_NAME') + "/article/";
        var date = getDate(doc);
        var url = root.ele('url');
        url.ele('loc', prefix + _.last(doc.urls)).up().
            ele('lastmod', date).up().
            ele('changefreq', 'never').up().
            ele('priority', '0.5').up();
        if (news)
            url.ele('news:news').
            ele('news:publication').
            ele('news:name', 'Duke Chronicle').up().
            ele('news:language', 'en').up().up().
            ele('news:publication_date', date).up().
            ele('news:title', doc.title);
    });
    return document.toString();
}

function getDate(doc) {
    var date = doc.updated || doc.created;
    if (date === undefined)
        return undefined;
    return util.formatTimestamp(date, "yyyy-mm-dd");
}
