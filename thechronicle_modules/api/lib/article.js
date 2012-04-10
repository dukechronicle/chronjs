var db = require('../../db-abstract');

var article = exports;

article.getDuplicates = function (limit, callback) {
    db.article.getDuplicates(limit, function(err, docs) {
        var dups = [];
        var lastDoc = {};
        var addedLastDoc = false;

        for(var i = 0; i < docs.length; i ++) {
            var doc = docs[i].value;
            
            // if the titles are the same, and the documents were created within a day of eachother
            if(doc.title == lastDoc.title && Math.abs(doc.created-lastDoc.created) <= 86400) {
                if(!addedLastDoc) dups.push(lastDoc);
                dups.push(doc);
                addedLastDoc = true;
            }
            else addedLastDoc = false;

            lastDoc = doc;
        }

        callback(err, dups);
    });
};


