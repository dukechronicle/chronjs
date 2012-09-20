var sitemap = exports;

var nock = require('nock');
var _ = require('underscore');

var db = require('./db-abstract');
var log = require('../../log');


sitemap.saveSitemap = function (type, index, attachment, callback) {
    attachment = {
        name: 'sitemap.xml.gz',
        data: attachment.toString('base64'),
        'content-type': 'application/xml',
        'content-encoding': 'gzip',
    };
    sitemap.get(type, index, function (err, docs) {
        if (err) callback(err);
        else if (docs.length === 0) {
            db.save({
                type: 'sitemap',
                sitemapType: type,
                index: index,
                _attachments: {'sitemap.xml.gz': attachment},
            }, callback);
        }
        else if (docs.length === 1) {
            db.saveAttachment(docs[0], attachment, callback);
        }
        else {
            return callback('Multiple ' + type + ' sitemaps with index ' + index);
        }
    });
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
