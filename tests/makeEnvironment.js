/* require internal modules */
var config = require('../thechronicle_modules/config');
var api = require('../thechronicle_modules/api');
var s3 = require('../thechronicle_modules/api');
var util = require('../thechronicle_modules/util');
var log = require('../thechronicle_modules/log');

var async = require('async');

var FAKE_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipisicing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut',
    'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi'
];

var IMAGES = [
    {
        url: 'http://collegesportsnation.com/ipad-wallpapers/duke-university-ipad-wallpapers/duke-university-ipad-wallpaper.jpg',
        type: 'image/jpg',
        width: 1024,
        height: 1024
    },
    {
        url: 'http://community.statesmanjournal.com/blogs/hoophead/files/2011/03/saldc5-5yre4xzu7s52wfyvj0k_original.jpg',
        type: 'image/jpg',
        width: 4074,
        height: 3096
    },
    {
        url: 'http://1.bp.blogspot.com/-7T2s2XUD8Ao/TXEjT4v-_gI/AAAAAAAAByo/pkhrzzypUiM/s1600/Twitter-Button.jpg',
        type: 'image/jpg',
        width: 891,
        height: 891
    }
];

var WORDS_FOR_BODY = 70;
var WORDS_FOR_TITLE = 4;
var WORDS_FOR_AUTHOR = 2;
var WORDS_FOR_TEASER = 7;
var NUM_ARTICLES = 25;

var ARTICLES_PER_LAYOUT_GROUP = 4;


// holds the IDs of the articles, once they have been found
var articleIDs = [];

log.init(function (err) {
    config.init(function(){}, function(err) {
        if(err) {
            console.log(err);
        }
        else if(!config.isSetUp()) {
            console.log('You must run server.js to set up config options before you can generate an environment');
        }
        else if(config.get('COUCHDB_URL').indexOf("heroku") != -1 || config.get('COUCHDB_URL').indexOf("cloudant") != -1 || config.get('S3_BUCKET').indexOf("production") != -1) {
            console.log("You can't create an environment using the production config options. Recommend use of db server chrondev.iriscouch.com and S3 bucket chron_dev");
        }
        else {
            console.log('creating environment...this could take a few minutes');
        
            async.waterfall([
                function(callback) {
                    api.init(callback);
                },
                function(callback) {
                    console.log("creating database...");
                
                    // delete old version of db and then create it again to start the db fresh            
                    api.recreateDatabase('dsfvblkjeiofkjd',callback);
                },
                function(callback) {
                    console.log("assigning unique image names...");
                    assignImageNames(callback);
                },
                function(callback) {
                    console.log("deleting old images for this db from s3...");
                    deleteOldImages(function(err) {
                        callback(null);
                    });
                },
                function(callback) {
                    console.log("creating search index...");
                   
                    // delete all articles for this db in the search index to start the index fresh
                    api.search.removeAllDocsFromSearch(function(err) {
                        callback(err);
                    });
                },
                function(callback) {
                    console.log('creating image originals and versions...');
                    createImages(callback);
                },
                function(images, callback) {
                    console.log("populating site with fake articles...");
                    addFakeArticles(images, callback);
                },
                function(callback) {
                    console.log("creating layouts...");
                    createLayoutGroups(callback);
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
    });
});

function _getCropFunc(img, newImage, imgTypes, key) {
    return function (cb) {
        var x1 = 0;
        var y1 = 0;
        var x2 = img.width;
        var y2 = (img.width / imgTypes[key].width) * imgTypes[key].height;  
  
        api.image.createCroppedVersion(img.name,imgTypes[key].width,imgTypes[key].height,x1,y1,x2,y2, function(err, result) {
           if(err) return cb(err); 
           newImage[key] = result._versionAdded;
           cb(null);
        });
    };
}

function _getImageDeleteFunction(imageName) {
    return function(cb) {
        console.log('deleting ' + imageName);
        api.s3.del(config.get("S3_BUCKET"), imageName, function(err) {
            if(err) console.log(err);
            cb(null);
        });
    };
}

function assignImageNames(callback) {
    // assigns each image a unique name based on the db so different dev environments don't have conflicts over images named the same
    for(var i = 0; i < IMAGES.length; i ++) {
        IMAGES[i].name = "abc-Picture-"+i+"-"+api.getDatabaseName()+"-"+api.getDatabaseHost()+"."+IMAGES[i].type.split("/")[1];
        console.log("assigned name " + IMAGES[i].name + " to image " + i);
    }
    callback(null);
}

function deleteOldImages(callback) {
    var imgTypes = api.image.IMAGE_TYPES;
    var functions = [];
    for(var i = 0; i < IMAGES.length; i ++) {
        functions.push(_getImageDeleteFunction(IMAGES[i].name));
        functions.push(_getImageDeleteFunction("thumb_"+IMAGES[i].name));
       
        for(var key in imgTypes) {
            functions.push(_getImageDeleteFunction(imgTypes[key].width + "x" + imgTypes[key].height + "-0-0-" + IMAGES[i].name));         
        }
    }
    async.parallel(functions, callback);
}

function createImage(img, callback) {
    var origId;
    var newImage = {};

    async.waterfall([     
        function(callback) {
            util.downloadUrlToPath(img.url, img.name, callback);
        },
        function(callback) {
            api.image.createOriginalFromFile(img.name, img.type, true, callback);
        },
        function(result, url, callback) {
            var imgTypes = api.image.IMAGE_TYPES;
            newImage['Original'] = result.id;

            var functions = [];
            for(var key in imgTypes) {
                functions.push(_getCropFunc(img, newImage, imgTypes, key));
            }
 
            async.series(functions, callback);
        }
    ],
    function(err, res) {
        callback(err, newImage);
    });
}

function createImages(topCallback) {
    async.map(IMAGES, createImage, topCallback);
}

function addFakeArticles(images, callback) {
    var fakeArticles = [];

    for(var i = 0; i < NUM_ARTICLES; i ++) {
        var article = {};
        article.title = generateSentence(WORDS_FOR_TITLE);
        article.body = generateSentence(WORDS_FOR_BODY);
        article.renderedBody = article.body;
        article.authors = [generateSentence(WORDS_FOR_AUTHOR)];
        article.teaser = generateSentence(WORDS_FOR_TEASER);
        article.type = "article";
        article.taxonomy = generateTaxonomy();
        article.images = images[getRandomNumber(images.length)];
        
        fakeArticles[i] = article;
    }

    async.forEachSeries(fakeArticles, function(article, cb) {
        console.log("adding article with title: '" + article.title + "'...");
        
        api.article.add(article, function(err, url, articleID) {
            if(err) console.log("article could not be added - " + err);
            else {
                console.log("article with url: '" + url + "' added.");
                articleIDs.push(articleID)
            }
            cb();
        });
    },
    callback);
}

function createLayoutGroups(callback) {
    var layoutGroups = api.group.getLayoutGroups();    
    var layoutPages = Object.keys(layoutGroups);

    async.forEachSeries(layoutPages,
        function(layoutPage, cb) {
            console.log('generating layout for ' + layoutPage);
            
            var namespace = layoutGroups[layoutPage].namespace;
            var groups = layoutGroups[layoutPage].groups;
            
            async.forEachSeries(groups,
                function(group, cb2) {
                    console.log('generating layout for ' + layoutPage + ' group ' + group);
                    
                    var articleIDsForThisGroup = []
                    for(var i = 0; i < ARTICLES_PER_LAYOUT_GROUP; i ++) {
                        var id = null;
                        while(true) {
                            id = articleIDs[getRandomNumber(articleIDs.length)];
                            
                            if(articleIDsForThisGroup.indexOf(id) == -1) break;
                        }                        
                        articleIDsForThisGroup.push(id);
                    }

                    var numAdded = 1;
                    async.forEachSeries(articleIDsForThisGroup,
                        function(id, cb3) {
                            api.group.add(namespace, group, id, numAdded, function(err) {
                                if(err) console.log(err);
                                else numAdded ++;
                                cb3();
                            });
                        },
                        cb2
                    );
                },
                cb
            );
        },
        callback
    );
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
    var tree = api.taxonomy.getTaxonomyTree();
    
    while (true) {
        var keys = Object.keys(tree);
        if (keys.length == 0)
            break;
        var section = keys[getRandomNumber(keys.length)];
        taxonomy.push(section);
        tree = tree[section];
    }

    return taxonomy;
}

function getRandomNumber(exclusiveMax) {
    return Math.floor(Math.random()*exclusiveMax);
}
