var cloudant = require('../cradle-connect');

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
    // list all groups keyed by path
    list_groups: {
        map: function(doc) {
            if(doc.type == 'group') {
                emit(doc.path.concat(doc.name), doc);
            }
        }
    },
    // get the uuid of all children keyed by fully qualified group name
    group_children: {
        map: function(doc) {
            if(doc.type == 'group') {
                doc.children.forEach(function(child_id) {
                    emit(doc.path.concat(doc.name), child_id);
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
