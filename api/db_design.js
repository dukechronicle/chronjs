var cloudant = require('./cloudant');

var db = cloudant.connect('chronicle') 

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
    urls: {
        map: function(doc) {
            if(doc.urls) {
                for(var i in doc.urls) {
                    emit(doc.urls[i], doc._id);
                }
            }
        }
    },
    authors: {
        map: function(doc) {
            if(doc.authors) {
                for(var i in doc.authors)
                    emit(doc.authors[i], doc._id);
            }
        }
    },
    list_bins: {
        map: function(doc) {
            if(doc.bin_name) {
                emit(doc.bin_name, doc);
            }
        }
    },
    bin_docs: {
        map: function(doc) {
            if(doc.bin_name) {
                doc.children.forEach(function(child_id) {
                    emit(doc.bin_name, child_id);
                });
            }
        }
    },
    all_by_date: {
        map: function(doc) {
            if(doc.title) {
                emit(doc.created, doc);
            }
        }
    }
};

db.save('_design/articles', views);
