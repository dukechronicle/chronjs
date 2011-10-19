var child_process = require('child_process')
var cradle = require('cradle');
var fs  = require('fs');
var path = require('path');
var api = require('../../api')
var async = require('async')

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
exports.db = db;


function ArticleParser(articleCallback) {
    var thisParser = this;

    this.parse = function(filepath, callback) {
	var filename = path.basename(filepath);
	if (filename[0] == "." || filename[0] == "_")
	    callback([filename], []);
	else {
	    fs.stat(filepath, function(err, stat) {
		if (err)
		    console.error("Can't stat" + err);
		else if (stat.isDirectory())
		    thisParser.parseDirectory(filepath, callback);
		else
		    thisParser.parseFile(filepath, callback);
	    });
	}
    }

    this.parseDirectory = function(directory, callback) {
	success = [];
	failed = [];
	fs.readdir(directory, function(err, contents) {
	    if (err) {
		console.error("Can't open directory", err);
		failed.push(directory);
		callback(failed, success);
	    }
	    else {
		async.forEach(contents,
			      function (filename, cb) {
				  var filepath = path.join(directory, filename);
				  thisParser.parse(filepath, function(fail, succeed) {
				      failed = failed.concat(fail);
				      success = success.concat(succeed);
				      cb();
				  });
			      },
			      function (err) {
				  callback(failed, success);
			      });
	    }
	});
    };

    this.parseFile = function(filepath, callback) {
    	var extension = path.extname(filepath);
	if (extension == '.xml') {
	    fs.readFile(filepath, function(err, data) {
		if (err) {
		    console.error("Can't open file" + err);
		    callback([filepath], []);
		}
		else {
		    var article = thisParser.parseXML(data.toString(), filepath);
		    if (article == undefined)
			callback([filepath], []);
		    articleCallback(article, callback);
		}
	    });
	}
	else {
	    console.error("Unknown file type: " + filepath);
	    callback([filepath], []);
	}
    };
    
    this.parseXML = function(xml, filename) {
	var articleObject = {};

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
	    console.error("Error getting article " + id);
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
		    console.log("Error adding article " + doc.title + ": " + err);
		callback();
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

function clearDatabase() {
    db.all(function (err, docs) {
	if (err)
	    console.error(err);
	if (docs) {
	    for (var i in docs) {
		db.remove(docs[i].id, docs[i].value.rev, function(err, res) {
		    if (err)
			console.log("Error removing article" + err);
		});
	    }
	}
    });
}

function runExporter(zipPath, exportCallback) {
    process.chdir('/var/tmp');
    child_process.exec("unzip -o "+ zipPath, function (error, stdout, stderr) {
	if (error)
	    console.error(error);
	else {
	    fs.unlink(zipPath);
	    var zipPattern = /creating: (.*)\/\n/;

	    var dirmatch = stdout.match(zipPattern);
	    if (dirmatch == undefined)
		console.log("Error unzipping file: " + zipPath);
	    else {
		var db_responses = [];

		var dir = dirmatch[1];
		console.log("XML Directory: " + dir);
		var parser = new ArticleParser(function(article, callback) {
		    addArticleToCouchDB(article, function(err) {
			if (err) {
			    console.error(err);
			    callback([article.title], []);
			}
			else
			    callback([], [article.title]);
//			    exportToProduction(article.id, callback);
		    });
		});
		parser.parse(dir, function(failed, successes) {
		    // System call because recursive directory deletion must be
		    // synchronous
		    console.log("Failed: " + failed);
		    console.log("Successes: " + successes);

		    console.log("Deleting " + dir);
		    child_process.exec("rm -r '" + dir + "'");

		    exportCallback(failed, successes);
		});
	    }
	}
    });
}
