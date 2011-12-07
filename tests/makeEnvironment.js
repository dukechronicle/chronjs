/* require internal modules */
var config = require('../thechronicle_modules/config');
var api = require('../thechronicle_modules/api/lib/api');

var async = require('async');

var FAKE_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipisicing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut',
    'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi'
];

var WORDS_FOR_BODY = 70;
var WORDS_FOR_TITLE = 4;
var WORDS_FOR_AUTHOR = 2;
var WORDS_FOR_TEASER = 7;

var NUM_ARTICLES = 25;

var TAXONOMY = config.get('TAXONOMY');

if(!config.isSetUp()) {
	console.log('You must set up config.js in the main directory before you can generate an environment');
}
else if(config.get('COUCHDB_URL').indexOf("heroku") != -1 || config.get('COUCHDB_URL').indexOf("cloudant") != -1) {
    console.log("You can't create an environment using the production config options. Recommend use of db server chrondev.iriscouch.com");
}
else {
    // TODO: add group/layout and image code    
    async.waterfall([
        function(callback) {
            api.init(callback);
        },
        function(callback) {
            console.log("creating database...");

            // delete old version of db and then create it again to start the db fresh            
            api.recreateDatabase(callback);
        },
        function(callback) {
            console.log("creating search index...");
           
            // delete all articles for this db in the search index to start the index fresh
            api.search.removeAllDocsFromSearch(function(err) {
                callback(err);
            });
        },
        function(callback) {
            console.log("populating site with fake articles...");
            addFakeArticles(callback);
        },
        function(callback) {
            console.log('environment created!');
            callback(null);
        }],
        function(err) {
              if (err) console.log(err);
        }
    );
}

function addFakeArticles(callback) {
    var fakeArticles = [];

    for(var i = 0; i < NUM_ARTICLES; i ++) {
        var article = {};
        article.title = generateSentence(WORDS_FOR_TITLE);
        article.body = generateSentence(WORDS_FOR_BODY);
        article.authors = [generateSentence(WORDS_FOR_AUTHOR)];
        article.teaser = generateSentence(WORDS_FOR_TEASER);
        article.type = "article";
        article.taxonomy = generateTaxonomy();

        fakeArticles[i] = article;
    }

    async.forEach(fakeArticles, function(article, cb) {
        console.log("adding article with title: '" + article.title + "'...");
        
        api.addDoc(article, function(err, url, articleID) {
            if(err) console.log("article could not be added - " + err);
            else console.log("article with url: '" + url + "' added.");
            cb();
        });
    },
    callback);
}

function generateSentence(numWords) {
    var string = "";
    
    for(var i = 0; i < numWords; i ++) {
        if(i != 0) {
            string = string + " ";
        }
        string = string + FAKE_WORDS[getRandomNumber(FAKE_WORDS.length)];
    }

    return string;
}

function generateTaxonomy() {
    var taxonomy = [];
    var taxonomyLevelTree = TAXONOMY;

    taxonomyLevelTree = taxonomyLevelTree[getRandomNumber(Object.keys(taxonomyLevelTree).length)];
    taxonomy[0] = Object.keys(taxonomyLevelTree)[0];

    var i = 1;
    while(true) {       
        taxonomyLevelTree = taxonomyLevelTree[taxonomy[i-1]];
        
        if(Object.keys(taxonomyLevelTree).length == 0) break;
        
        taxonomyLevelTree = taxonomyLevelTree[getRandomNumber(Object.keys(taxonomyLevelTree).length)];
        taxonomy[i] = Object.keys(taxonomyLevelTree)[getRandomNumber(Object.keys(taxonomyLevelTree).length)];
        i ++;
    }

    console.log(taxonomy);
    return taxonomy;
}

function getRandomNumber(exclusiveMax) {
    return Math.floor(Math.random()*exclusiveMax);
}
