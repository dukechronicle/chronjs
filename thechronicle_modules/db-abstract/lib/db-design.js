exports.doc = {

    articles: {
        language: "javascript",

        views: {

            /*
             * Returns all articles keyed by each author's name, taxonomy, and
             * date created. Used, for example, to find all opinion columns by
             * an author.
             */
            authors_and_taxonomy: {
                map: function(doc) {
                    if (doc.type == "article" && doc.authors && doc.taxonomy) {
                        for (var a in doc.authors) {
                            var name = doc.authors[a].toLowerCase();
                            name = name.replace(/-/g, ' ');
                            var path = [];
                            emit([name, [], parseInt(doc.created)], doc);
                            for (var t in doc.taxonomy) {
                                path.push(doc.taxonomy[t].toLowerCase());
                                emit([name, eval(uneval(path)), parseInt(doc.created)], doc);
                            }
                        }
                    }
                }
            },

            /*
             * Returns all articles keyed by the day created and title
             */
            duplicates: {
                map: function (doc) {
                    if (doc.type == "article" && doc.title) {
                        emit([Math.floor(doc.created/86400), doc.title], doc);
                    }
                }
            },

            // get the uuid of all children keyed by fully qualified group name
            groups: {
                map: function (doc) {
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
                reduce: function (keys, values, rereduce) {
                    if (rereduce) {
                        return sum(values);
                    } else {
                        return values.length;
                    }
                }
            },

            /*
             * Returns all articles with images keyed by image id.
             */
            images: {
                map: function (doc) {
                    if (doc.type == "article" && doc.images) {
                        for (var type in doc.images) {
                            emit(doc.images[type], doc);
                        }
                    }
                }
            },

            /*
             * Returns all articles and the version of their index in Solr.
             */
            indexed_by_solr: {
                map: function (doc) {
                    if (doc.type == "article" && doc.title && doc.body) {
                        if (doc.indexedBySolr == null ||
                            typeof doc.indexedBySolr != 'number')
                            emit(-1, doc);
                        else emit(doc.indexedBySolr, doc);
                    }
                }
            },

            /*
             * Returns all articles keyed by the taxonomy. Emits a document for
             * each parent taxonomy of the article as well. Keys also contain
             * article's creation timestamp.
             */
            taxonomy: {
                map: function (doc) {
                    if (doc.type == "article" && doc.taxonomy) {
                        var path = [];
                        emit([[], parseInt(doc.created)], doc);
                        for (var i in doc.taxonomy) {
                            path.push(doc.taxonomy[i].toLowerCase());
                            emit([eval(uneval(path)), parseInt(doc.created)], doc);
                        }
                    }
                }
            },

            /*
             * Returns all taxonomies of the articles in the database.
             */
            taxonomy_tree: {
                map: function (doc) {
                    if (doc.type == "article" && doc.taxonomy) {
                        emit(doc.taxonomy);
                    }
                }
            },

            /*
             * Returns all articles and associated images keyed by each of the
             * article's urls.
             */
            urls: {
                map:function (doc) {
                    if (doc.type == "article" && doc.urls) {
                        for (var i in doc.urls) {
                            emit([doc.urls[i], "article"], {_id:doc.id});
                            if (doc.images) {
                                for (var type in doc.images) {
                                    emit([doc.urls[i], "images", type], {_id:doc.images[type]});
                                }
                            }
                        }
                    }
                }
            }

        },

        lists: {

            filterCount: function(head, req) {
                if (!req.query.listLimit) {
                    req.query.listLimit = 1;
                }
                var row;
                var rows = [];
                while(row = getRow()) {
                    if (row.value > req.query.min) {
                        rows.push(row.key);
                        if (rows.length >= req.query.listLimit) {
                            send(JSON.stringify(rows));
                            return;
                        }
                    }
                }
                send(JSON.stringify(rows));
            }

        }
    },

    authors: {
        language: "javascript",

        views: {
            author_info: {
                map: function (doc) {
                    if (doc.type == "author") {
                        var name = doc.name.toLowerCase();
                        name = name.replace(/-/g, ' ');
                        emit(name, doc);
                        if (doc.images) {
                            for (var type in doc.images) {
                                emit(name, {_id:doc.images[type]});
                            }
                        }
                    }
                }
            },
            columnists_info: {
                map: function (doc) {
                    if (doc.type == "author" && doc.currentColumnist) {
                        var name = doc.name.toLowerCase();
                        name = name.replace(/-/g, ' ');
                        emit(name, doc);
                        if (doc.images) {
                            for (var type in doc.images) {
                                emit(name, {_id:doc.images[type]});
                            }
                        }
                    }
                }
            }
        }
    },

    images: {
        language: "javascript",

        views: {

            originals: {
                map: function (doc) {
                    if (doc.imageVersions) {
                        var date = parseInt(doc.date);
                        if(isNaN(date)) date = 0;                
                        emit(date, doc);
                    }
                }
            },

            originals_index: {
                map: function (doc) {
                    if (doc.imageVersions) {
                        emit(doc.name, doc);
                    }
                }
            },

            versions: {
                map: function (doc) {
                    if (doc.type == "imageVersion" && doc.original) {
                        emit(doc.original, doc);
                    }
                }
            },

            photographers: {
                map: function (doc) {
                    if (doc.photographer) {
                        emit(doc.photographer, doc);
                    }
                }
            }
        }
    },

    polls: {
        language: "javascript",

        views: {

            taxonomy: {
                map: function (doc) {
                    if (doc.type == 'poll' && doc.taxonomy && doc.created) {
                        var path = [];
                        emit([[], parseInt(doc.created)], doc);
                        for (var i in doc.taxonomy) {
                            path.push(doc.taxonomy[i]);
                            emit([eval(uneval(path)), parseInt(doc.created)], doc);
                        }
                    }
                }
            },

            title: {
                map: function (doc) {
                    if (doc.type == 'poll' && doc.title)
                        emit(doc.title, doc);
                }
            },

            votes: {
                map: function (doc) {
                    if (doc.type == 'poll' && doc.answers) {
                        var sum = 0;
                        for (var i in doc.answers)
                            sum += doc.answers[i];
                        emit(sum, doc);
                    }
                }
            }
        }
    },

    pages: {
        language: 'javascript',

        views: {

            all: {
                map: function (doc) {
                    if (doc.type === 'page') {
                        emit(doc._id, doc);
                    }
                }
            },

            byUrl: {
                map: function (doc) {
                    if (doc.type === 'page' && doc.urls) {
                        for (var i = 0; i < doc.urls.length; i++) {
                            emit(doc.urls[i], doc);
                        }
                    }
                }
            }
        }
    },

    sitemaps: {
        language: 'javascript',

        views: {
            byType: {
                map: function (doc) {
                    if (doc.type === 'sitemap') {
                        emit([doc.sitemapType, doc.index], doc._rev);
                    }
                }
            }
        }
    }

};
