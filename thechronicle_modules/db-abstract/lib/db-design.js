var _ = require('underscore');

var views = {

    taxonomy:{
        map:function (doc) {
            if (doc.taxonomy) {
                for (var i in doc.taxonomy) {
                    emit([doc.taxonomy[i], parseInt(doc.created, 10)], doc);
                }
            }
        }
    },
    // return all doc ids keyed by doc url if one exists
    urls:{
        map:function (doc) {
            if (doc.urls) {
                for (var i in doc.urls) {
                    emit([doc.urls[i], "article"], doc);
                    if (doc.images) {
                        for (var type in doc.images) {
                            emit([doc.urls[i], "images", type], {_id:doc.images[type]});
                        }
                    }
                }
            }
        }
    },
    // return all doc ids keyed by doc url if one exists
    duplicate_urls:{
        map:function (doc) {
            if (doc.urls) {
                for (var i in doc.urls) {
                    emit(doc.urls[i], null);
                }
            }
        },
        reduce:function (keys, values, rereduce) {
            if (rereduce) {
                return sum(values);
            } else {
                return 1;
            }
        }
    },
    // return all node page documents
    nodes:{
        map:function (doc) {
            if (doc.node_title) {
                emit(doc.node_title, doc._id);
            }
        }
    },
    // return all doc ids keyed by document author name if one exists
    authors:{
        map:function (doc) {
            if (doc.authors) {
                for (var i in doc.authors) {
                    emit([doc.authors[i], doc.created], doc._id);
                }
            }
        }
    },
    authors_and_taxonomy:{
        map:function(doc) {
            if (doc.authors && doc.taxonomy) {
                for (var t in doc.taxonomy) {
                    for (var a in doc.authors) {
                        emit([doc.authors[a], doc.taxonomy[t], parseInt(doc.created, 10)], doc);
                    }
                }
            }
        }
    },
    // get the uuid of all children keyed by fully qualified group name
    groups:{
        map:function (doc) {
            if (doc.groups) {
                doc.groups.forEach(function (group) {
                    emit(group.concat("article"), {title:doc.title});

                    if (doc.images) {
                        for (var type in doc.images) {
                            var newgroup;
                            newgroup = group.concat(["image", type]);
                            emit(newgroup, {_id:doc.images[type]});
                        }
                    }
                });
            }
        },
        reduce:function (keys, values, rereduce) {
            if (rereduce) {
                return sum(values);
            } else {
                return values.length;
            }
        }
    },
    // return articles keyed by date
    all_by_date:{
        map:function (doc) {
            if (doc.urls) {
                emit(parseInt(doc.created, 10), doc);
            }
        }
    },
    image_originals:{
        map:function (doc) {
            if (doc.imageVersions) {
                var date = parseInt(doc.date);
                if(isNaN(date)) date = 0;                
                emit(date, doc);
            }
        }
    },
    image_originals_index:{
        map:function (doc) {
            if (doc.imageVersions) {
                emit(doc.name, doc);
            }
        }
    },
    image_versions:{
        map:function (doc) {
            if (doc.original) {
                emit(doc.original, doc);
            }
        }
    },
    article_images:{
        map:function (doc) {
            if (doc.images) {
                for (var type in doc.images) {
                    emit(doc.images[type], doc);
                }
            }
        }
    },
    photographers:{
        map:function (doc) {
            if (doc.photographer) {
                emit(doc.photographer, doc);
            }
        }
    },


    // return all articles and the version of their index in Solr
    indexed_by_solr:{
        map:function (doc) {
            if (doc.title && doc.body) {
                if (doc.indexedBySolr == null || typeof(doc.indexedBySolr) != 'number') emit(-1, doc);
                else emit(doc.indexedBySolr, doc);
            }
        }
    },

    // builds the taxonomy tree from each's docs taxonomy
    taxonomy_tree:{
        map:function (doc) {
            if (doc.taxonomy) {
                emit(doc.taxonomy, null);
            }
        },
        reduce:function (keys, vals) {
            return null;
        }
    }
};

var lists = {
    filterCount: function(head, req) {
        var row;
        while(row = getRow()) {
            if (row.value > req.query.min) send(row)
        }
    }
};

exports.getDoc = function () {
    var designDoc = {};
    designDoc.language = "javascript";
    designDoc.views = views;
    designDoc.lists = lists;
    return designDoc;
};

