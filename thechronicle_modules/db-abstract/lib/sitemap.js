var sitemap = exports;

var db = require('./db-abstract');


sitemap.saveSitemap = function (type, index, attachment, callback) {
    sitemap.get(type, index, function (err, docs) {
        if (err) callback(err);
        else if (docs.length === 0) {
            db.save({
                type: 'sitemap',
                sitemapType: type,
                index: index,
            }, function (err, doc) {
                db.saveAttachment(doc, attachment, callback);
            });
        }
        else if (docs.length === 1) {
            db.saveAttachment(docs[0], attachment, callback);
        }
        else {
            return callback('Multiple ' + type + ' sitemaps with index ' + index);
        }
    });
};
