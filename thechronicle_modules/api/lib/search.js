var solr = require('solr');
var config = require('../../config');
var api = require("./api");
var _ = require("underscore");
var db = require("../../db-abstract");

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

// check for unindexed articles and index them in solr.
search.indexUnindexedArticles = function() {
    console.log('looking for articles to index...');
    search.docsNotIndexed(function(err, response) {
        // Attempt to index each file in row.
        response.forEach(function(row) {
            console.log('indexing "' + row.title + '"');
            search.indexArticle(row._id,row.title,row.body, function(error2, response2) {
                if(error2) console.log(error2);
                else {
                    db.merge(row._id, {indexedBySolr: true}, function(error3, response3) {
                        if(error3) console.log(error3);
                        else console.log('indexed "' + row.title + '"');
                    });
                }
            });
        });
    });
}

search.docsNotIndexed = function(callback) {
    db.view("articles/not_indexed_by_solr", callback);
}

search.indexArticle = function(id,title,body,callback) {
	// adds the article to the solr database for searching	
	var client = solr.createClient(config.get('SOLR_HOST'),config.get('SOLR_PORT'),config.get('SOLR_CORE'),config.get('SOLR_PATH'));
	console.log((title));
	var solrDoc = {
		id: createSolrIDFromDBID(id),
		type: 'article',
		title_text: title.toLowerCase(),
		body_text:  body.toLowerCase(),
		database_text: db.getDatabaseName(),
        database_host_text: db.getDatabaseHost()
	};

    client.add(solrDoc, {commit:true}, callback);
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

search.docsByTitleSearch = function(title, callback) {
	title = title.toLowerCase().replace(/ /g,'* OR title_text:');			
	var query = "database_host_text:"+db.getDatabaseHost()+" AND database_text:"+db.getDatabaseName()+" AND (title_text:"+title+"*)";
	
	var client = solr.createClient(config.get('SOLR_HOST'),config.get('SOLR_PORT'),config.get('SOLR_CORE'),config.get('SOLR_PATH')); 		
	client.query(query, {rows: 25, fl: "*,score", sort: "score desc"}, function(err,response) {
		if(err) {
			callback(err);
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
