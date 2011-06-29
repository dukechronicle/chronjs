var db = require('./lib/db-abstract');

var views = {
    descendants: {
        map: function(doc) {
            if (doc.title) {
                for (var i in doc.path) {
                    emit([doc.path[i], doc.path], doc)
                }
            }
        }
    },
    tree: {
        map: function(doc) {
            if (doc.type == "node") {
                emit(doc.path, doc)
            }
        },
        reduce: function(keys, vals, rereduce) {
            if (rereduce) {
                return {};
            }
            tree = {};
            for (var i in vals)
            {
                current = tree;
                for (var j in vals[i].path)
                {
                    child = vals[i].path[j];
                    if (current[child] == undefined) {
                        current[child] = {};
                    }
                    current = current[child];
                }
            }
            return tree;
        }
    },
    // return all doc ids keyed by doc url if one exists
    urls: {
        map: function(doc) {
            if(doc.urls) {
                for(var i in doc.urls) {
                    emit(doc.urls[i], doc._id);
                }
            }
        }
    },
    // return all doc ids keyed by document author name if one exists
    authors: {
        map: function(doc) {
            if(doc.authors) {
                for(var i in doc.authors)
                    emit(doc.authors[i], doc._id);
            }
        }
    },
    // list all groups keyed by path
    group_list: {
        map: function(doc) {
            if(doc.type == 'group') {
                emit([doc.namespace, doc.name], doc);
            }
        }
    },
    // get the uuid of all children keyed by fully qualified group name
    group_docs: {
        map: function(doc) {
            if(doc.type == 'group') {
                doc.docs.forEach(function(doc_id) {
                    emit([doc.namespace, doc.name], doc_id);
                });
            }
        }
    },
    // return articles keyed by date
    all_by_date: {
        map: function(doc) {
            if(doc.title) {
                emit(doc.created, doc);
            }
        }
    },
    image_originals: {
        map: function(doc) {
            if(doc.imageVersions) {
                emit(doc.name, doc);
            }
        }
    },
    photographers: {
        map: function(doc) {
            if(doc.photographer) {
                emit(doc.photographer, doc);
            }
        }
    }
};

db.save('_design/articles', views);
