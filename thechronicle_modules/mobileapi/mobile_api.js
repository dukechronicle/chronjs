var globalFunctions = require('../global-functions');
var api = require('../api/lib/api');

function grabArticles(namespace, groupName, baseDocNum, n,callback){
    api.group.docsN(namespace, groupName, baseDocNum, 1, function(err,groupDocs){
        if(err){
            callback(err,null);
        } 
        else {

            //groupDocs = The documents that are returned
            //console.log(groupDocs);
            //console.log(groupDocs[groupName]);
            //console.log(groupDocs[groupName][0].title);

            //
            callback(err,groupDocs[groupName]);
        }
    });
}

// science, world, politics, bball/sports, comics, photos, videos, durham,  etc... add more later.
exports.getFeaturedArticles = function(n,callback){
    grabArticles(["section"],["featured"],0,n,callback);
}

exports.getTopStories = function(n,callback){
    grabArticles(["section"],["top stories"],0,n,callback);
}

exports.getMostPopular = function(n,callback){
    grabArticles(["section"],["most popular"],0,n,callback);
}

exports.getMoreTopStories = function(n,callback){
    grabArticles(["section"],["top stories"],0,n,callback);
}
