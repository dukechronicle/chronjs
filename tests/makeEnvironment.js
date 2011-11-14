/* require internal modules */
var config = require('../thechronicle_modules/config');
var api = require('../thechronicle_modules/api/lib/api');

var async = require('async');

var fakeArticles = [
    {title:"title 1", body:"body 1", taxonomy:["News"], authors:["author 1"], teaser:"teaser 1", type:"article"},
    {title:"title 2", body:"body 2", taxonomy:["News","University"], authors:["author 2"], teaser:"teaser 2", type:"article"},
    {title:"title 3", body:"body 3", taxonomy:["News","University","Speakers & Events"], authors:["author 3"], teaser:"teaser 3", type:"article"},
    {title:"title 4", body:"body 4", taxonomy:["News","Local & National"], authors:["author 4"], teaser:"teaser 4", type:"article"},
    {title:"title 5", body:"body 5", taxonomy:["News"], authors:["author 5"], teaser:"teaser 5", type:"article"},
    {title:"title 6", body:"body 6", taxonomy:["Sports"], authors:["author 6"], teaser:"teaser 6", type:"article"},
    {title:"title 7", body:"body 7", taxonomy:["Sports","Baseball"], authors:["author 7"], teaser:"teaser 7", type:"article"},
    {title:"title 8", body:"body 8", taxonomy:["Sports","Men's"], authors:["author 8"], teaser:"teaser 8", type:"article"},
    {title:"title 9", body:"body 9", taxonomy:["Sports","Men's","M Basketball"], authors:["author 9"], teaser:"teaser 9", type:"article"},
    {title:"title 10", body:"body 10", taxonomy:["Opinion"], authors:["author 10"], teaser:"teaser 10", type:"article"},
    {title:"title 11", body:"body 11", taxonomy:["Opinion","Editorial"], authors:["author 11"], teaser:"teaser 11", type:"article"},
    {title:"title 12", body:"body 12", taxonomy:["Opinion","Cartoons"], authors:["author 12"], teaser:"teaser 12", type:"article"},
    {title:"title 13", body:"body 13", taxonomy:["Opinion","Column", "Senior Column"], authors:["author 13", "author 12"], teaser:"teaser 13", type:"article"},
    {title:"title 14", body:"body 14", taxonomy:["Recess"], authors:["author 14"], teaser:"teaser 14", type:"article"},
    {title:"title 15", body:"body 15", taxonomy:["Recess","Arts"], authors:["author 15"], teaser:"teaser 15", type:"article"},
    {title:"title 16", body:"body 16", taxonomy:["Recess","Film"], authors:["author 16"], teaser:"teaser 16", type:"article"},
    {title:"title 17", body:"body 17", taxonomy:["Recess","Food","Food Review"], authors:["author 17"], teaser:"teaser 17", type:"article"},
    {title:"title 18", body:"body 18", taxonomy:["Towerview"], authors:["author 18"], teaser:"teaser 18", type:"article"},
    {title:"title 19", body:"body 19", taxonomy:["Towerview", "Bus Stop"], authors:["author 19"], teaser:"teaser 19", type:"article"},
    {title:"title 20", body:"body 20", taxonomy:["Towerview", "Prefix"], authors:["author 20", "author 19"], teaser:"teaser 20", type:"article"},
    {title:"title 21", body:"body 21", taxonomy:["Towerview", "Savvy", "Endorsement"], authors:["author 21", "author 1"], teaser:"teaser 21", type:"article"},
];

if(!config.isSetUp()) {
	console.log('You must set up config.js in the main directory before you can generate an environment');
}
else {
    api.init(function(err1) {
        if (err1) console.log(err1);
        else {
            console.log("creating database...");
            api.recreateDatabase(function(err2) {
                api.search.removeAllDocsFromSearch(function(err3) {
                    addFakeArticles(function(err4) {
                        if (err4) console.log(err4);
                        else console.log('environment created!');
                    });
                });
            });
        }
    });
}

function addFakeArticles(callback) {
    async.forEach(fakeArticles, function(article, cb) {
        console.log("adding article with title: '" + article.title + "...'");
        
        api.addDoc(article, function(err, url, articleID) {
            if(err) console.log("article could not be added - " + err);
            else console.log("article with url: '" + url + "' added.");
            cb();
        });
    },
    callback);
}
