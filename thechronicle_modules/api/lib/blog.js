var blog = exports;

var api = require('../../api');
var config = require('../../config');
var db = require('../../db-abstract');
var log = require('../../log');
var redis = require('../../redisclient');
var util = require("../../util");

var md = require('discount');
var _ = require("underscore");

var MAX_URL_LENGTH = 50;
var RESULTS_PER_PAGE = 25;

blog.getByBlog = function(blog, callback) {
    db.blog.getByBlog(blog, function(err, docs) {
        // docs could be array of posts to show on frontpage
        callback(null, docs);
    });
};

blog.getByBlogAndUrl = function(blog, url, callback) {
    db.blog.getByBlogAndUrl(blog, url, function(err, res) {
        // Copied from article.getByUrl
        if (err) return callback(err);

        if (res.length === 0) {
            return callback("Article does not exist");
        }

        var doc = {};
        res.forEach(function (key, value) {
            var docType = key[1];

            if (docType === "article") {
                doc = value;
                doc.images = {};
            }
            else if (docType === "images") {
                if (value.url) {
                    value.url = api.s3.getCloudFrontUrl(value.url);
                }
                var imageType = key[2];
                doc.images[imageType] = value;
            }
        });
        callback(null, doc);
    });
};

function URLify(s, maxChars) {
    maxChars = maxChars || MAX_URL_LENGTH;

    var removelist = ["a", "an", "as", "at", "before", "but", "by", "for", "from",
                      "is", "in", "into", "like", "of", "off", "on", "onto", "per",
                      "since", "than", "the", "this", "that", "to", "up", "via",
                      "with"];
    
    var r = new RegExp("\\b(" + removelist.join("|") + ")\\b", "gi");
    s = s.replace(r, "");
    
    s = s.replace(/[^-\w\s]/g, "");  // remove unneeded chars
    s = s.replace(/^\s+|\s+$/g, ""); // trim leading/trailing spaces
    s = s.replace(/[-\s]+/g, "-");   // convert spaces to hyphens
    s = s.toLowerCase();             // convert to lowercase
    return s.substring(0, maxChars);// trim to first num_chars chars
}

function getAvailableUrl(url, n, callback) {
    var new_url = url;
    if(n !== 0) {
        new_url = new_url + "-" + n;
    }
    db.view("articles/urls", {key: [new_url, "article"]}, function(err, res) {
        if(err) {
            callback(err, null);
        }
        else if(res.rows.length === 0) {
            callback(null, new_url);
        }
        else {
            getAvailableUrl(url, n + 1, callback);
        }
    });
}

blog.add = function (article, callback) {
    getAvailableUrl(URLify(article.title), 0, function(err, url) {
        if (err) return callback(err);

        var unix_timestamp = util.unixTimestamp();
        article.created = article.created || unix_timestamp;
        article.updated = article.created || unix_timestamp;
        article.urls = [ url ];
        article.indexedBySolr = api.search.getIndexVersion();
        article.renderedBody = api.article.renderBody(article.body);

        console.log(article);
        db.save(article, function(err, res) {
            if (err) return callback(err);
            else callback(null, url, res.id);
        });
    });
};