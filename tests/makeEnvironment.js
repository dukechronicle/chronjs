/* require internal modules */
var config = require('../thechronicle_modules/config');
var api = require('../thechronicle_modules/api/lib/api');

var async = require('async');

var FAKE_WORDS = [
    'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipisicing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut',
    'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi'
];

var WORDS_FOR_BODY = 70;
var WORDS_FOR_TITLE = 4;
var WORDS_FOR_AUTHOR = 2;
var WORDS_FOR_TEASER = 7;

var NUM_ARTICLES = 25;

var TAXONOMIES_TO_USE = [
    ["News","University"],
    ["News","University","Speakers & Events"],
    ["News","Local & National"],
    ["News"],
    ["Sports"],
    ["Sports","Baseball"],
    ["Sports","Men's"],
    ["Sports","Men's","M Basketball"],
    ["Opinion"],
    ["Opinion","Editorial"],
    ["Opinion","Cartoons"],
    ["Opinion","Column", "Senior Column"],
    ["Recess"],
    ["Recess","Arts"],
    ["Recess","Film"],
    ["Recess","Food","Food Review"],
    ["Towerview"],
    ["Towerview", "Bus Stop"], 
    ["Towerview", "Prefix"],
    ["Towerview", "Savvy", "Endorsement"],
    
];

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
        article.taxonomy = TAXONOMIES_TO_USE[getRandomNumber(TAXONOMIES_TO_USE.length)];

        fakeArticles[i] = article;
    }

    console.log('here');
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

function getRandomNumber(exclusiveMax) {
    return Math.floor(Math.random()*exclusiveMax);
}
