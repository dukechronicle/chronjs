var blog = exports;

var api = require('../../api');
var config = require('../../config');
var db = require('../../db-abstract');
var log = require('../../log');
var redis = require('../../redisclient');
var util = require("../../util");

var md = require('discount');
var _ = require("underscore");

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