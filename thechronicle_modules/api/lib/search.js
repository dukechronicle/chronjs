var solr = require('solr');
var dateFormat = require('dateformat');
var async = require('async');

var config = require('../../config');
var globalFunctions = require('../../global-functions');
var log = require('../../log');
var api = require("./api");
var _ = require("underscore");
var db = require("../../db-abstract");

// whenever the way an article should be indexed by solr is changed, this number should be incremented
// so the server knows it has to reindex all articles not using the newest indexing version. Keep the number numeric!
var INDEX_VERSION = 0.5008;
var RESULTS_PER_PAGE = 25;

var client = null;

var search = {};
var exports = module.exports = search;

function getDBIDFromSolrID(solr_id) {
    // since our solr document ids are stored as db_id||DBNAME||DBHOST we need to parse out the db_id to use
    tempid = solr_id.split("||",1); 
    return tempid[0];
}

function createSolrIDFromDBID(db_id) {
    // since we may be using multiple dbs that all use the same db document id, to make each doc unique we append the db name and host
    // to the back. otherwise, one db's indexes will overwrite another db's indexes in solr.
    return db_id+"||"+db.getDatabaseName()+"||"+db.getDatabaseHost();
}

search.getIndexVersion = function() {
    return INDEX_VERSION;
}

search.init = function() {
    client = solr.createClient(config.get('SOLR_HOST'),config.get('SOLR_PORT'),config.get('SOLR_CORE'),config.get('SOLR_PATH'));
}

// check for unindexed articles, or articles with index versioning below the current version, and index them in solr.
search.indexUnindexedArticles = function(count) {
    log.notice('looking for articles to index...');
    db.search.docsIndexedBelowVersion(INDEX_VERSION, count, function(err, response) {
        // Attempt to index each file in row.
        response.forEach(function(row) {
            process.nextTick(function() {
                log.debug('indexing "' + row.title + '"');

                search.indexArticle(row._id, row.title, row.body, row.taxonomy, row.authors, row.created, function(error2, response2) {
                    if(error2) log.warning(error2);
                    else {

                        db.search.setArticleAsIndexed(row._id, INDEX_VERSION, function(error3, response3) {
                            if(error3) log.warning(error3);
                            else log.debug('indexed "' + row.title + '"');
                        });
                    }
                });
            })
        });
    });
}

search.indexArticle = function(id,title,body,taxonomy,authors,createdDate,callback) {
	// adds the article to the solr database for searching	
	if (body) body = body.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
    else body = "";
    if (title) title = title.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
    else title = "";

    if (authors) {
        authors = _.compact(authors);
        authors = authors.map(function(author) {
            return author.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').toLowerCase();
        });
    }

    var section = undefined;
    if(taxonomy && taxonomy[0]) section = taxonomy[0];
    
    var date = new Date(createdDate * 1000); // turn seconds into milliseconds
    
    var solrDate;
    var solrYear;
    var solrMonth;
    var solrDay;
    try {
        solrDate = dateFormat(date,"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"); // turns date into solr's date format: 1995-12-31T23:59:59Z
        solrYear = dateFormat(date,"yyyy");
        solrMonth = dateFormat(date,"mm");
        solrDay = dateFormat(date,"dd");
    }
    catch(err) {  // if date is invalid use today's date
        solrDate = dateFormat(new Date(),"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'");
        solrYear = dateFormat(new Date(),"yyyy");
        solrMonth = dateFormat(new Date(),"mm");
        solrDay = dateFormat(new Date(),"dd");
    }

    // if you change this object (and in doing so change the index), you MUST increment INDEX_VERSION at the top of this script 
    var solrDoc = {
		id: createSolrIDFromDBID(id),
		type: 'article',
        author_sm: authors,
		title_text: title.toLowerCase(),
		body_text:  body.toLowerCase(),
        section_s: section,
		database_s: db.getDatabaseName(),
        database_host_s: db.getDatabaseHost(),
        created_date_d: solrDate,
        created_year_i: solrYear,
        created_month_i: solrMonth,
        created_day_i: solrDay
	}; 

    // unindex the article before you index it, just incase it was using an old verion of the indexing
    search.unindexArticle(id, function(err,resp) { 
        if(err) log.warning(err);
        else client.add(solrDoc, {commit:true}, callback);
    }); 
}

search.unindexArticle = function(id, callback) {
    client.del(createSolrIDFromDBID(id), null, callback); 
}

// don't call this. only used by environment maker
// removes all indexes from solr for the db we are using and sets all documents in the db we are using to not being indexed by solr
search.removeAllDocsFromSearch = function(callback) {
    api.docsByDate(null, function(err, response) {
        response = response || {};
        async.forEach(response, function(row, cb) {
            log.debug('unindexing "' + row.title + '"');
            client.del(createSolrIDFromDBID(row._id), null, function(err,resp) { 
                log.debug(resp);
                db.merge(row._id, {indexedBySolr: false}, function(error3, response3) {
                    if(error3) log.warning(error3);
                    else log.debug('unindexed "' + row.title + '"');
                    cb(null);
                });
            });
        },
        function(err) {
            // just incase the search index and the db were out of sync, delete everything in the search index for this db that may not have been covered above
            client.del(null,"database_host_s:"+db.getDatabaseHost()+" AND database_s:"+db.getDatabaseName(),callback);
        });
    });
}

search.docsByAuthor = function(authorName, sortOrder, facets, page, callback) {
    if(sortOrder != 'asc') sortOrder = 'desc';
    if(page < 1) page = 1;

    var facetFields;
    var facetQueries;
    _makeFacets(facets, function(facetFieldsTemp,facetQueriesTemp) {
        facetFields = facetFieldsTemp;
        facetQueries = facetQueriesTemp;
    });

    querySolr('author_sm:"' + authorName.toLowerCase() +'"',
    {
        facet: true,
        "facet.field":facetFields,
        fq:facetQueries,
        rows: RESULTS_PER_PAGE,
        start: RESULTS_PER_PAGE*(page-1),
        fl: "*",
        sort: 'created_date_d' + " " + sortOrder
    },
    callback);
}

search.docsBySearchQuery = function(wordsQuery, sortBy, sortOrder, facets, page, callback) {
    wordsQuery = globalFunctions.trim(wordsQuery);    
    if(wordsQuery.length == 0) wordsQuery = "--";

    if(sortBy == 'relevance') sortBy = 'score';
    else if(sortBy == 'date') sortBy = 'created_date_d';
    else sortBy = 'score';

    if(sortOrder != 'asc') sortOrder = 'desc';
    if(page < 1) page = 1;

    var facetFields;
    var facetQueries;
    _makeFacets(facets, function(facetFieldsTemp,facetQueriesTemp) {
        facetFields = facetFieldsTemp;
        facetQueries = facetQueriesTemp;
    });

    wordsQuery = wordsQuery.toLowerCase();
    var words = wordsQuery.split(" ");

    words = words.map(function(word) {
        return solr.valueEscape(word.replace(/"/g, '')); // remove "s from the query
    });

	var fullQuery = "";
    for(var index = 0; index < words.length; index ++) {
        if(index != 0) fullQuery = fullQuery + " OR ";
        fullQuery = fullQuery + "title_text:" + words[index] + " OR body_text:" + words[index];
    }

    querySolr(fullQuery,
    {
      facet: true,
      "facet.field":facetFields,
      fq:facetQueries,
      rows: RESULTS_PER_PAGE,
      start: RESULTS_PER_PAGE*(page-1),
      fl: "*,score",
      sort: sortBy + " " + sortOrder,
      "f.created_year_i.facet.sort":"index",
      "f.created_month_i.facet.sort":"index",
      "f.created_day_i.facet.sort":"index"
    },
    callback);
}

function querySolr(query,options,callback) {
    if(query.length > 0) {
        query = "database_host_s:"+db.getDatabaseHost()+" AND database_s:"+db.getDatabaseName() +" AND (" + query + ")";	
    }    

    client.query(query, options, function(err,response) {
		if(err) {
			return callback(err);
		}

        var responseObj = JSON.parse(response);
        log.debug(responseObj);
        // put facet into an easily manipulitable form
        var facets = {};
        if(responseObj.facet_counts) {
            for(var fieldName in responseObj.facet_counts.facet_fields) {
                var niceName = fieldName;
                if(fieldName == 'section_s') niceName = "Section";
                else if(fieldName == 'author_sm') niceName = "Author";
                else if(fieldName == 'created_year_i') niceName = "Year";    
                else if(fieldName == 'created_month_i') niceName = "Month";    
                else if(fieldName == 'created_day_i') niceName = "Day";         

                facets[niceName] = {};
                var field = responseObj.facet_counts.facet_fields[fieldName];
                for(var i = 0; i < field.length; i += 2) {
                    if(field[i+1] > 0) {
                        facets[niceName][field[i]] = field[i+1];
                    }
                }
            }            
        }
        //log.debug(facets);
        
        var ids = [];
        var tempid;
        var docs = responseObj.response.docs;
        //log.debug(docs);
        for(var docNum = 0; docNum < docs.length; docNum ++)
        {
            var tempid = getDBIDFromSolrID(docs[docNum].id);
            ids.push(tempid);
        }
        
        api.docsById(ids,function(err, docs) {
            if (err) return callback(err);

            // replace each array element with the actual document data for that element            
            docs = _.map(docs, function(doc) {
                return doc.doc;
            });
            
            // remove any null array elements.
            docs = _.compact(docs);

            callback(null, docs, facets);
        });
    });
}

// adds extra facet fields if certain facet fields were queried (ex:if you limited the search by year, show month facet), and constructs facet queries
// by changing nice key names to their solr equivalents (ex: year changes to created_year_i in the facet query)
function _makeFacets(facets,callback) {
    var facetFields = ["created_year_i"];
    var facetQueries = [];
    if(facets) {
        var indivFacets = facets.split(",");
        for(var i = 0; i < indivFacets.length; i ++) {
            var parts = indivFacets[i].split(":");
            
            if(parts[0] == 'Section') parts[0] = "section_s";
            else if(parts[0] == 'Author') parts[0] = "author_sm";
            
            else if(parts[0] == 'Year') {
                parts[0] = "created_year_i";
                facetFields.push("created_month_i");
            }
            else if(parts[0] == 'Month') {
                parts[0] = "created_month_i";
                facetFields.push("created_day_i");
            }
            else if(parts[0] == 'Day') parts[0] = "created_day_i";
            
            facetQueries.push(parts[0]+':"'+parts[1]+'"');
        }
    }

    facetFields.push("section_s");
    facetFields.push("author_sm");

    callback(facetFields,facetQueries);
}
