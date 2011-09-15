var solr = require('solr');
var dateFormat = require('dateformat');

var config = require('../../config');
var api = require("./api");
var _ = require("underscore");
var db = require("../../db-abstract");

// whenever the way an article should be indexed by solr is changed, this number should be incremented
// so the server knows it has to reindex all articles not using the newest indexing version. Keep the number numeric!
var INDEX_VERSION = 0.48;

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

// check for unindexed articles, or articles with index versioning below the current version, and index them in solr.
search.indexUnindexedArticles = function() {
    console.log('looking for articles to index...');
    db.search.docsIndexedBelowVersion(INDEX_VERSION, function(err, response) {
        // Attempt to index each file in row.
        response.forEach(function(row) {
            console.log('indexing "' + row.title + '"');
            search.indexArticle(row._id,row.title,row.body, row.authors, row.created, function(error2, response2) {
                if(error2) console.log(error2);
                else {
                    db.search.setArticleAsIndexed(row._id, INDEX_VERSION, function(error3, response3) {
                        if(error3) console.log(error3);
                        else console.log('indexed "' + row.title + '"');
                    });              
                }
            });
        });
    });
}

search.indexArticle = function(id,title,body,authors,createdDate,callback) {
	// adds the article to the solr database for searching	
	var client = solr.createClient(config.get('SOLR_HOST'),config.get('SOLR_PORT'),config.get('SOLR_CORE'),config.get('SOLR_PATH'));
    
    var date = new Date();
    date.setTime(createdDate * 1000);  // turn seconds into milliseconds
    
    var solrDate;
    try {
        solrDate = dateFormat(date,"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"); // turns date into solr's date format: 1995-12-31T23:59:59Z
    }
    catch(err) { // if date is invalid use today's date
        solrDate = dateFormat(new Date(),"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'");
    }	

    // if you change this object (and in doing so change the index), you MUST increment INDEX_VERSION at the top of this script 
    var solrDoc = {
		id: createSolrIDFromDBID(id),
		type: 'article',
        author_text: authors,
		title_text: title.toLowerCase(),
		body_text:  body.toLowerCase(),
		database_text: db.getDatabaseName(),
        database_host_text: db.getDatabaseHost(),
        created_date_d: solrDate
	}; 

    // unindex the article before you index it, just incase it was using an old verion of the indexing
    client.del(createSolrIDFromDBID(id), null, function(err,resp) { 
        if(!err) console.log('unindexed "' + title + '"');
        else console.log(err);
                  
        client.add(solrDoc, {commit:true}, callback);
    }); 
}

// don't call this.
// removes all indexes from solr for the db we are using and sets all documents in the db we are using to not being indexed by solr
search.removeAllDocsFromSearch = function(callback) {
    var client = solr.createClient(config.get('SOLR_HOST'),config.get('SOLR_PORT'),config.get('SOLR_CORE'),config.get('SOLR_PATH'));         
    
    api.docsByDate(null, function(err, response) {
        response.forEach(function(row) {
                console.log('unindexing "' + row.title + '"');
                client.del(createSolrIDFromDBID(row._id), null, function(err,resp) { 
                    console.log(resp);
                    db.merge(row._id, {indexedBySolr: false}, function(error3, response3) {
                        if(error3) console.log(error3);
                        else console.log('unindexed "' + row.title + '"');
                    });
                });
        });
    });     
    callback(null);
}

search.docsBySearchQuery = function(query, callback) {
	query = query.toLowerCase();
    var words = query.split(" ");
			
	var fullQuery = "database_host_text:"+db.getDatabaseHost()+" AND database_text:"+db.getDatabaseName() +" AND (";
    for(index in words) {
        if(index != 0) fullQuery = fullQuery + " OR ";
        fullQuery = fullQuery + "title_text:" + words[index] + "* OR body_text:" + words[index] + "*";
    }
    fullQuery = fullQuery + ")";
	
	var client = solr.createClient(config.get('SOLR_HOST'),config.get('SOLR_PORT'),config.get('SOLR_CORE'),config.get('SOLR_PATH')); 		
	client.query(fullQuery, {rows: 25, fl: "*,score", sort: "score desc"}, function(err,response) {
		if(err) {
			return callback(err);
		}

        var responseObj = JSON.parse(response);
        console.log(responseObj);
        
        var ids = [];
        var tempid;
        var docs = responseObj.response.docs;
        console.log(docs);
        for(var docNum in docs)
        {
            var tempid = getDBIDFromSolrID(docs[docNum].id);
            ids.push(tempid);
        }
        
        api.docsById(ids,function(err, docs) {
            if (err) callback(err);

            // replace each array element with the actual document data for that element            
            docs = _.map(docs, function(doc) {
                return doc.doc;
            });
            
            // remove any null array elements.
            docs = _.compact(docs);

            callback(null,docs);
        });
    });
}
