var sitemap = exports;

var async = require('async');
var _ = require('underscore');

var db = require('./db-abstract');
var log = require('../../log');


sitemap.saveSitemap = function (type, index, attachment, callback) {
    attachment = {
        'sitemap.xml.gz': {
            data: attachment.toString('base64'),
            'content-type': 'application/xml',
            'content-encoding': 'gzip',
        }
    };
    db.save({
        type: 'sitemap',
        sitemapType: type,
        index: index,
        _attachments: attachment,
    }, callback);
};

sitemap.get = function (type, index, callback) {
    db.view('sitemaps/byType', {key: [type, index]}, function (err, docs) {
        if (err) return callback(err);
        _.each(docs, function (doc) {
            doc.rev = doc.value;
            delete doc.value;
        });
        callback(null, docs);
    });
};

sitemap.remove = function (type, callback) {
    var query = {
        startkey: [type],
        endkey: [type, {}],
    };
    db.view('sitemaps/byType', query, function (err, docs) {
        if (err) return callback(err);
        _.each(docs, function (doc) {
            doc.rev = doc.value;
            delete doc.value;
        });
        async.forEach(docs, function (doc, callback) {
            db.remove(doc.id, doc.rev, callback);
        }, callback);
    });
};
