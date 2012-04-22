var solr = require('solr');
var dateFormat = require('dateformat');
var async = require('async');
var url = require("url");
var _ = require("underscore");

var api = require("./api");
var config = require('../../config');
var db = require("../../db-abstract");
var log = require('../../log');
var util = require('../../util');


// whenever the way an article should be indexed by solr is changed, this number should be incremented
// so the server knows it has to reindex all articles not using the newest indexing version. Keep the number numeric!
var INDEX_VERSION = 0.5011;
var RESULTS_PER_PAGE = 25;
var MAX_MATCHED_PHRASES_PER_ARTICLE = 4;
var COMMON_WORDS = ["the","be","to","of","and","a","in","that","have","it","for","not","on","with","he","as","you","do","at", "I"];

var client = null;

var search = {};
var exports = module.exports = search;

function getDBIDFromSolrID(solr_id) {
    // since our solr document ids are stored as db_id||DBNAME||DBHOST we need to parse out the db_id to use
    var tempid = solr_id.split("||", 1);
    return tempid[0];
}

function createSolrIDFromDBID(db_id) {
    // since we may be using multiple dbs that all use the same db document id, to make each doc unique we append the db name and host
    // to the back. otherwise, one db's indexes will overwrite another db's indexes in solr.
    return db_id + "||" + db.getDatabaseName() + "||" + db.getDatabaseHost();
}

search.getIndexVersion = function() {
    return INDEX_VERSION;
};

search.init = function() {
    var solrUrl = url.parse(config.get('SOLR_URL'));
    
    var solrPathArray = solrUrl.pathname.split("/");
    var solrCore = "/" + solrPathArray[2];
    var solrPath = "/" + solrPathArray[1];

    client = solr.createClient({
        host: solrUrl.hostname,
        port: solrUrl.port,
        core: solrCore,
        path: solrPath
    });
};

// check for unindexed articles, or articles with index versioning below the current version, and index them in solr.
search.indexUnindexedArticles = function(count) {
    log.notice('looking for articles to index...');
    db.search.docsIndexedBelowVersion(INDEX_VERSION, count, function(err, response) {
        // Attempt to index each file in row.
        response.forEach(function(row) {
            process.nextTick(function() {
                search.indexArticle(row._id, row.title, row.renderedBody, row.taxonomy, row.authors, row.created, function(error2, response2) {
                    if(error2)
                        log.warning(error2);
                    else {
                        db.search.setArticleAsIndexed(row._id, INDEX_VERSION, function(error3, response3) {
                            if(error3)
                                log.warning(error3);
                            else
                                log.info('indexed ' + row.title);
                        });
                    }
                });
            })
        });
    });
};

search.indexArticle = function(id, title, body, taxonomy, authors, createdDate, callback) {
    // adds the article to the solr database for searching
    if(body)
        body = body.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
    else
        body = "";
    if(title)
        title = title.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
    else
        title = "";

    if(authors) {
        authors = _.compact(authors);
        authors = authors.map(function(author) {
            return author.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').toLowerCase();
        });
    }

    var section = undefined;
    if(taxonomy && taxonomy[0])
        section = taxonomy[0];

    var date = new Date(createdDate * 1000);
    // turn seconds into milliseconds

    var solrDate;
    var solrYear;
    var solrMonth;
    var solrDay;
    try {
        solrDate = dateFormat(date, "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'");
        // turns date into solr's date format: 1995-12-31T23:59:59Z
        solrYear = dateFormat(date, "yyyy");
        solrMonth = dateFormat(date, "mm");
        solrDay = dateFormat(date, "dd");
    } catch (err) {// if date is invalid use today's date
        solrDate = dateFormat(new Date(), "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'");
        solrYear = dateFormat(new Date(), "yyyy");
        solrMonth = dateFormat(new Date(), "mm");
        solrDay = dateFormat(new Date(), "dd");
    }

    // if you change this object (and in doing so change the index), you MUST increment INDEX_VERSION at the top of this script
    var solrDoc = {
        id : createSolrIDFromDBID(id),
        type : 'article',
        author_sm : authors,
        title_textv : title.toLowerCase(),
        body_textv : body.toLowerCase(),
        section_s : section,
        database_s : db.getDatabaseName(),
        database_host_s : db.getDatabaseHost(),
        created_date_d : solrDate,
        created_year_i : solrYear,
        created_month_i : solrMonth,
        created_day_i : solrDay
    };

    client.add(solrDoc, {
        commit : true
    }, callback);
};

search.unindexArticle = function(id, callback) {
    client.del(createSolrIDFromDBID(id), null, callback);
};

// don't call this. only used by environment maker
// removes all indexes from solr for the db we are using and sets all documents in the db we are using to not being indexed by solr
search.removeAllDocsFromSearch = function(callback) {
    api.docsByDate(null, null, function(err, response) {
        response = response || {};
        async.forEach(response, function(row, cb) {
            client.del(createSolrIDFromDBID(row._id), null, function(err, resp) {
                db.merge(row._id, {
                    indexedBySolr : false
                }, function(error3, response3) {
                    if(error3)
                        log.warning(error3);
                    cb(null);
                });
            });
        }, function(err) {
            // just incase the search index and the db were out of sync, delete everything in the search index for this db that may not have been covered above
            client.del(null, "database_host_s:" + db.getDatabaseHost() + " AND database_s:" + db.getDatabaseName(), callback);
        });
    });
};

search.docsByAuthor = function(authorName, sortOrder, facets, page, callback) {
    if(sortOrder != 'asc')
        sortOrder = 'desc';
    if(page < 1)
        page = 1;

    var facetFields;
    var facetQueries;
    _makeFacets(facets, function(facetFieldsTemp, facetQueriesTemp) {
        facetFields = facetFieldsTemp;
        facetQueries = facetQueriesTemp;
    });
    querySolr('author_sm:"' + authorName.toLowerCase() + '"', {
        facet : true,
        "facet.field" : facetFields,
        fq : facetQueries,
        rows : RESULTS_PER_PAGE,
        start : RESULTS_PER_PAGE * (page - 1),
        fl : "*",
        sort : 'created_date_d' + " " + sortOrder
    }, callback);
};

// Function for searching by query
search.docsBySearchQuery = function(wordsQuery, sortBy, sortOrder, facets, page, emboldenMatchedTerms, callback) {
    wordsQuery = util.trim(wordsQuery);
    if(wordsQuery.length == 0)
        wordsQuery = "--";

    if(sortBy == 'relevance')
        sortBy = 'score';
    else if(sortBy == 'date')
        sortBy = 'created_date_d';
    else
        sortBy = 'score';

    if(sortOrder != 'asc')
        sortOrder = 'desc';
    if(page < 1)
        page = 1;

    var facetFields;
    var facetQueries;
    _makeFacets(facets, function(facetFieldsTemp, facetQueriesTemp) {
        facetFields = facetFieldsTemp;
        facetQueries = facetQueriesTemp;
    });

    wordsQuery = wordsQuery.toLowerCase();

    var words = wordsQuery.split(" ");
    words = words.map(function(word) {
        var newString = solr.valueEscape(word.replace(/"/g, '')); //remove "s from the query

        if(newString.length == 0)
            return '""';
        else
            return newString;
    });

    var fullQuery = "";
    if(wordsQuery.indexOf('"') === 0 && wordsQuery.indexOf('"',1) === wordsQuery.length-1) {
        // user searched for exact match
        fullQuery = 'title_textv:' + wordsQuery + ' OR body_textv:' + wordsQuery + ' OR author_sm:' + wordsQuery;
    }
    else {
        fullQuery = 'author_sm:"' + wordsQuery.replace(/"/g, '') + '"';
        for(var index = 0; index < words.length; index++) {
            fullQuery = fullQuery + " OR title_textv:" + words[index] + " OR body_textv:" + words[index];
        }
    }

    querySolr(fullQuery, {
        facet : true,
        "facet.field" : facetFields,
        fq : facetQueries,
        rows : RESULTS_PER_PAGE,
        start : RESULTS_PER_PAGE * (page - 1),
        fl : "*,score",
        sort : sortBy + " " + sortOrder,
        "f.created_year_i.facet.sort" : "index",
        "f.created_month_i.facet.sort" : "index",
        "f.created_day_i.facet.sort" : "index"
    },
    function(err, docs, facets) {
        if(err) return callback(err);

        // replace teaser with text around matched terms
        var regexString = "";
        words.forEach(function(word) {
            if(COMMON_WORDS.indexOf(word) == -1) {
                if(regexString.length > 0) regexString += "|";
                regexString += "\\b"+word+"\\b";
            }     
        });
        var regex = new RegExp(regexString,"gi");
        
        docs.forEach(function(doc) {
            var sentenceFinds = {};
            var body = doc.renderedBody || doc.body;
            var sentences = body.replace(/<[^>]*>/gm," ").split("."); //remove html from body and then split by sentence

            for(var i = 0; i < sentences.length; i ++) {
                var startPos = 0;  
                while(startPos != -1) {
                    startPos = sentences[i].regexIndexOf(regex,startPos);
                    if(startPos != -1) {
                        if(!sentenceFinds[i]) sentenceFinds[i] = 0;
                        sentenceFinds[i] ++;
                        startPos ++;
                    }
                }           
            }

            var numPhrases = MAX_MATCHED_PHRASES_PER_ARTICLE;
            if(sentences.length < numPhrases) numPhrases = sentences.length;
            
            var sentencesToUse = [];
            for(var j = 0; j < numPhrases; j ++) {
                var use = 0;
                for(var k = 0; k < sentences.length; k ++) {
                    if(sentenceFinds[use] < sentenceFinds[k]) use = k;
                }
                if(sentenceFinds[use] > 0) sentencesToUse.push(use);
                sentenceFinds[use] = 0;
            }

            var newTeaser = "...";
            for(var l = 0; l < sentencesToUse.length; l ++) {
                newTeaser += util.trim(sentences[sentencesToUse[l]]) + "...";
            }
            if(newTeaser != "...") doc.teaser = newTeaser;
        });

        if(emboldenMatchedTerms) {
            // bold all matched words
            docs.forEach(function(doc) {
                if(doc.teaser) doc.teaser = doc.teaser.replace(regex, function(m){return _embolden(m)});
                if(doc.title) doc.title = doc.title.replace(regex, function(m){return _embolden(m)});
                
                doc.authors = _.map(doc.authors, function(author) {
                    return author.replace(regex, function(m){return _embolden(m)});                    
                });
            });  
        }

        callback(err, docs, facets);
    });
};

search.relatedArticles = function(id, count, callback) {
    var fullQuery = 'id:' + createSolrIDFromDBID(id);

    querySolr(fullQuery, {
        mlt : true,
        'mlt.count' : count,
        'mlt.fl' : "body_textv,title_textv"
    }, function(err, docs, facets, relatedArticles) {
        callback(err, relatedArticles);
    });

}

function querySolr(query, options, callback) {
    if(query.length > 0) {
        query = "database_host_s:" + db.getDatabaseHost() + " AND database_s:" + db.getDatabaseName() + " AND (" + query + ")";
    }

    client.query(query, options, function(err, response) {
        if(err) {
            return callback(err);
        }

        var responseObj = JSON.parse(response);
        // put facet into an easily manipulitable form
        var facets = {};
        if(responseObj.facet_counts) {
            for(var fieldName in responseObj.facet_counts.facet_fields) {
                var niceName = fieldName;
                if(fieldName == 'section_s')
                    niceName = "Section";
                else if(fieldName == 'author_sm')
                    niceName = "Author";
                else if(fieldName == 'created_year_i')
                    niceName = "Year";
                else if(fieldName == 'created_month_i')
                    niceName = "Month";
                else if(fieldName == 'created_day_i')
                    niceName = "Day";

                facets[niceName] = {};
                var field = responseObj.facet_counts.facet_fields[fieldName];
                for(var i = 0; i < field.length; i += 2) {
                    if(field[i + 1] > 0) {
                        if(niceName == "Author") {
                            field[i] = util.capitalizeWords(field[i]);
                        }
                        facets[niceName][field[i]] = field[i + 1];
                    }
                }

                // sort authors alphabetically
                if(niceName == "Author") {
                    facets[niceName] = _sortObjByKeys(facets[niceName]);
                }
            }
        }

        var ids = [];
        var docs = responseObj.response.docs;

        var relatedIds = [];
        var relatedDocs = [];
        if(responseObj.moreLikeThis) {
            var key = Object.keys(responseObj.moreLikeThis)[0];
            if(responseObj.moreLikeThis[key] != null) {
                relatedDocs = responseObj.moreLikeThis[key].docs;
            }
        }

        for(var docNum = 0; docNum < docs.length; docNum++) {
            var tempid = getDBIDFromSolrID(docs[docNum].id);
            ids.push(tempid);
        }

        for(var docNum = 0; docNum < relatedDocs.length; docNum++) {
            var tempid = getDBIDFromSolrID(relatedDocs[docNum].id);
            relatedIds.push(tempid);
        }

        async.parallel({
            queriedDocs: function(cb) {
                if(ids.length == 0) return cb(null, []);

                api.docsById(ids, function(err, docs) {
                    if(err)
                        return cb(err);

                    // replace each array element with the actual document data for that element
                    docs = _.map(docs, function(doc) {
                        return doc.doc;
                    });
                    // remove any null array elements.
                    docs = _.compact(docs);

                    cb(null, docs);
                });
            },
            relatedDocs: function(cb) {
                if(relatedIds.length == 0) return cb(null, []);

                api.docsById(relatedIds, function(err, docs) {
                    if(err)
                        return cb(err);

                    // replace each array element with the actual document data for that element
                    docs = _.map(docs, function(doc) {
                        return doc.doc;
                    });
                    // remove any null array elements.
                    docs = _.compact(docs);

                    cb(null, docs);
                });
            }},
            function(err, results) {
                if(err) return callback(err);

                callback(null, results.queriedDocs, facets, results.relatedDocs);
            }
        );
    });
}

// adds extra facet fields if certain facet fields were queried (ex:if you limited the search by year, show month facet), and constructs facet queries
// by changing nice key names to their solr equivalents (ex: year changes to created_year_i in the facet query)
function _makeFacets(facets, callback) {
    var facetFields = ["created_year_i"];
    var facetQueries = [];
    if(facets) {
        var indivFacets = facets.split(",");
        for(var i = 0; i < indivFacets.length; i++) {
            var parts = indivFacets[i].split(":");

            if(parts[0] == 'Section')
                parts[0] = "section_s";

            else if(parts[0] == 'Author') {
                parts[0] = "author_sm";
                parts[1] = parts[1].toLowerCase();
                // do a case-insensitive author search
            } else if(parts[0] == 'Year') {
                parts[0] = "created_year_i";
                facetFields.push("created_month_i");
            } else if(parts[0] == 'Month') {
                parts[0] = "created_month_i";
                facetFields.push("created_day_i");
            } else if(parts[0] == 'Day')
                parts[0] = "created_day_i";

            facetQueries.push(parts[0] + ':"' + parts[1] + '"');
        }
    }

    facetFields.push("section_s");
    facetFields.push("author_sm");

    callback(facetFields, facetQueries);
}

function _sortObjByKeys(arr) {
    // Setup Arrays
    var sortedKeys = Object.keys(arr).sort();
    var sortedObj = {};

    // Reconstruct sorted obj based on keys
    for(var i = 0; i < sortedKeys.length; i++) {
        sortedObj[sortedKeys[i]] = arr[sortedKeys[i]];
    }
    return sortedObj;
}

function _embolden(match) {
    return "<strong>"+match+"</strong>";
};

String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};
