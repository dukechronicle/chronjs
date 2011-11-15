var db = require('../../db-abstract');
var _ = require("underscore");

var image = exports;

image.getOriginal = function (name, callback) {
    db.image.originalsIndex({
        key:name
    }, function (err, res) {
        if (err) callback(err, null);
        else {
            if (res.length != 1) callback('Original not found', null);
            else callback(null, res[0]);
        }
    });
};

image.createOriginal = function (name, url, contentType, thumbUrl, photographer, caption, location, callback) {
    var metadata = {
        url:url,
        contentType:contentType,
        thumbUrl:thumbUrl,
        photographer:photographer,
        caption:caption,
        location:location,
        date:new Date().getTime()
    };
    db.image.createOriginal(name, metadata, callback);
};

image.edit = function (imageID, data, callback) {
    db.image.edit(imageID, data, callback);
};

image.createVersion = function (parentId, url, width, height, callback) {
    var options = {
        url:url,
        width:width,
        height:height
    };
    db.image.createVersion(parentId, options, callback);
};

image.originalsForPhotographer = function (photog, callback) {
    db.image.originalsForPhotographer(photog, callback);
};

image.getAllOriginals = function (start, callback) {
    db.image.listOriginalsByDate(start, function (err, res) {
        res = res.map(function (doc) {
            doc.displayName = doc.name;
            var nameSplit = doc.name.split("-", 2);
            if (nameSplit.length > 1) doc.displayName = nameSplit[1];
            return doc;
        });

        // sort by date, accounting for badly formatted dates
        res = _.sortBy(res, function (image) {
            
            var d = new Date(image.date);

            // if date not valid, set it to a really old date
            if (!_isValidDate(d)) d = new Date(0);

            return d.getTime();
        });

        res.reverse(); // newest images first

        callback(err, res);
    });
};

function _isValidDate(d) {
  if ( Object.prototype.toString.call(d) !== "[object Date]" )
    return false;
  return !isNaN(d.getTime());
}
