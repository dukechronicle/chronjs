var child_process = require('child_process')
var cradle = require('cradle');
var fs  = require('fs');
var path = require('path');
var api = require('../../api')


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


function ArticleParser(defaultDate, articleCallback) {
    var thisParser = this;
    this.articles = [];

    this.parse = function(filepath, callback) {
	var filename = path.basename(filepath);
	if (filename[0] != "." && filename[0] != "_") {
	    fs.stat(filepath, function(err, stat) {
		if (err)
		    console.log(err);
		else if (stat.isDirectory())
		    thisParser.parseDirectory(filepath, callback);
		else
		    thisParser.parseFile(filepath, callback);
	    });
	}
    }

    this.parseDirectory = function(directory, callback) {
	var filesOutstanding = 0;
	fs.readdir(directory, function(err, contents) {
	    contents.forEach(function (filename) {
		if (filename[0] != "." && filename[0] != "_") {
		    var filepath = path.join(directory, filename);
		    filesOutstanding++;
		    thisParser.parse(filepath, function() {
			if (--filesOutstanding == 0) callback();
		    });
		}
	    });
	});
    };

    this.parseFile = function(filepath, callback) {
    	var extension = path.extname(filepath);
	if (extension == '.xml') {
	    fs.readFile(filepath, function(err, data) {
		if (err)
		    console.log(err);
		else {
		    var article = thisParser.parseXML(data.toString(), filepath, defaultDate);
		    thisParser.articles.push(article);
		    articleCallback(article, callback);
		}
	    });
	}
	else if (extension == '.jpg') {
	    /*
	    if (typeof articleObject.image == 'undefined') {
		articleObject.image = {};
	    }
	    var imageType = filename.split('_')[0];
	    switch (imageType) {
	    case 'article':
		articleObject.image.article = path + '/' + filename;
		break;
	    case 'nsthumb':
		articleObject.image.nsthumb = path + '/' + filename;
		break;
	    case 'thumb':
		articleObject.image.thumb = path + '/' + filename;
n		break;
	    }
	    */
	}
	else
	    throw "Unknown file type: " + filepath;
    };
    
    this.parseXML = function(xml, filename, defaultDate) {
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

function addArticleToCouchDB(db, article, callback) {
    if (Object.keys(article).length > 0) {
	db.save(article.id, article, function (err, res) {
	    if (err)
		callback("Error uploading article: " + article.title)
	    else
		callback(null)
	});
    }
}

function exportToProduction(id, callback) {
    db.get(id, function (err, doc) {
	if (err)
	    console.log("Error getting article " + id);
	else {
	    fields = {};
	    fields.title = doc.title;
	    fields.body = doc.body;
	    fields.author = doc.author;
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

function clearDatabase(db) {
    db.all(function (err, docs) {
	if (err)
	    console.log(err);
	if (docs) {
	    for (var i in docs) {
		db.remove(docs[i].id, docs[i].value.rev, function(err, res) {
		    if (err)
			console.log(err);
		    if (res)
			console.log(res);
		});
	    }
	}
    });
}

function runExporter(zipPath, exportCallback) {
    process.chdir('/var/tmp');
    child_process.exec("unzip -o "+ zipPath, function (error, stdout, stderr) {
	if (error)
	    console.log(error);
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
		var date = path.basename(dir).match(/\d{6}/)[0];
		var parser = new ArticleParser(date, function(article, callback) {
		    addArticleToCouchDB(db, article, function(err) {
			if (err) {
			    console.log(err);
			    callback();
			}
			else {
			    exportToProduction(article.id, callback);
			}   
		    });
		});
		parser.parseDirectory(dir, function(filepath) {
		    // System call because recursive directory deletion must be
		    // synchronous
		    exportCallback();
		    console.log("Deleting " + dir);
		    child_process.exec("rm -r '" + dir + "'");
//		    exportCouchDBToDrupal(function() {
//			clearDatabase(db);
//		    });
		});
	    }
	}
    });
}
