var child_process = require('child_process')
var cradle = require('cradle');
var fs  = require('fs');
var path = require('path');
var api = require('../../api')
var async = require('async')
var zipfile = require('zipfile')

var bodyPattern = new RegExp('\[^\]*</drawOrder></frame></page><text>(.+?)</text>\[^\]*', "g");
var inlineStoryTagPattern =  new RegExp('<inlineTag name="Story">', "g");
var authorArticlePattern = new RegExp('^by (.+?)<break type="paragraph" />', "g");
var reportArticlePattern = new RegExp('^from (.+?)<break type="paragraph" />', "g");
var chroniclePattern = new RegExp('THE CHRONICLE<break type="paragraph" />', "g");
var articleIdPattern = new RegExp("\[^\]*<article><id>(\\d+)</id>\[^\]*", "g");
var sectionPattern = new RegExp("\[^\]*<section><id>[0-9]+</id><name>(.+?)</name></section>\[^\]*", "g");
var titlePattern = new RegExp("\[^\]*<tag>Root</tag><text><inlineTag name=\"Root\">(.+?)</inlineTag></text>\[^\]*", "g");
var authorPattern = new RegExp("\[^\]*<metadata><name>Author</name><value><string>(.+?)</string></value></metadata>\[^\]*", "g");


db = new cradle.Connection('http://chrondev.iriscouch.com', 80, {
		    auth: { username: 'dean', password: 'dspc' }
		}).database('k4export')

exports.runExporter = runExporter;
exports.clearDatabase = clearDatabase;
exports.db = db;


function ArticleParser(articleCallback) {
    var thisParser = this;

    this.parse = function(zipPath, callback) {
        var succeed = [];
        var failed  = [];
        var zipFile = new zipfile.ZipFile(zipPath);
        async.forEach(zipFile.names,
            function(name, cb) {
                if (path.basename(name)[0] == "." ||
                    name[name.length - 1] == "/") {
                    cb();
                } else {
                    thisParser.parseFile(zipFile, name, function(err, title) {
                    if (err)
                        failed.push(err);
                    else
                        succeed.push(title);
                    cb();
                    });
                }
            },
            function (err) {
                callback(failed, succeed);
            }
        );
    }

    this.parseFile = function(zipFile, name, callback) {
    	var extension = path.extname(name);
	if (extension == '.xml') {
	    zipFile.readFile(name, function(err, data) {
            if (err) {
                console.error("Can't open file: " + err);
                callback(name);
            } else {
                var article = thisParser.parseXML(data.toString(), name);
                if (article == undefined) callback(name);
                else articleCallback(article, callback);
            }
	    });
	}
	else {
	    console.error("Unknown file type: " + name);
	    callback(name);
	}
    };
    
    this.parseXML = function(xml, filename) {
	var articleObject = {};

	if (xml.search(bodyPattern) == -1 ||
	    xml.search(titlePattern) == -1)
	    return undefined;

	var body = xml.replace(bodyPattern, "$1");
	body = body.replace(inlineStoryTagPattern, '');
	body = body.replace(authorArticlePattern, '');
	body = body.replace(chroniclePattern, '');
	body = body.replace(reportArticlePattern, '');
	body = "<p>" + body.replace(/\s*<break type="paragraph" \/>\s*/g, '</p><p>') + "</p>";
    
	articleObject.body = body;
	articleObject.section = xml.replace(sectionPattern, "$1");
	articleObject.author = xml.replace(authorPattern, "$1");
	articleObject.id = xml.replace(articleIdPattern, "$1");
	articleObject.title = xml.replace(titlePattern, "$1");

	var date = path.basename(filename).match(/\d{6}/);
	if (date) articleObject.date = date[0];

	return articleObject;
    };
}

function addArticleToCouchDB(article, callback) {
    if (Object.keys(article).length > 0) {
	db.save(article.id, article, function (err, res) {
	    if (err)
		callback(err);
	    else
		callback();
	});
    }
}

function exportToProduction(id, callback) {
    db.get(id, function (err, doc) {
	if (err)
	    callback(id);
	else {
	    fields = {};
	    fields.title = doc.title;
	    fields.body = doc.body;
	    fields.author = [ doc.author ];
	    fields.import_id = doc.id;
	    fields.taxonomy = [ doc.section ];
	    fields.type = 'article';
	    fields.publish = false;
	    fields.teaser = "";
	    api.addDoc(fields, function (err) {
		if (err)
		    callback(doc.title);
		else
		    callback(null, doc.title);
	    });
	}
    });
}

function exportCouchDBToDrupal(callback) {
    var drupalScript = {
	host: '173.203.221.240',
	port: 80,
	path: '/fetchAll.php?key=9048',
    }
    http.get(drupalScript, function(response) {
	console.log("Production server:\n" + response);
	callback();
    });
}

function clearDatabase(callback) {
    db.all(function (err, docs) {
	if (err) {
	    console.error(err);
	    callback(err);
	}
	else {
	    async.forEachSeries(docs,  // forEach returns doc.value not doc
	         function (doc, cb) {
		     db.remove(doc.id, doc.value.rev,
			       function(err, res) {
				   if (err) cb(err);
				   else     cb();
			       });
		 },
		 callback);
	}
    });
}

function runExporter(zipPath, exportCallback) {
    var parser = new ArticleParser(function(article, callback) {
	addArticleToCouchDB(article, function(err) {
	    if (err) {
		console.error(err);
		callback(article.title);
	    }
	    else
	        exportToProduction(article.id, callback);
	});
    });

    parser.parse(zipPath, function(failed, successes) {
	// System call because recursive directory deletion must be
	// synchronous
	console.log("Failed: " + failed);
	console.log("Successes: " + successes);
	fs.unlink(zipPath);
	exportCallback(failed, successes);
    });
}
