var child_process = require('child_process')
var cradle = require('cradle');
var fs  = require('fs');
var path = require('path');
var api = require('../../api')
var async = require('async')
var sax = require('sax')
var zipfile = require('zipfile')

var bodyPattern = new RegExp('\[^\]*<text><inlineTag name=\"Story\">(.+?)</inlineTag></text>\[^\]*', "g");

var authorArticlePattern = new RegExp('^by (.+?)<break type="paragraph" />', "g");
var reportArticlePattern = new RegExp('^from (.+?)<break type="paragraph" />', "g");
var chroniclePattern = new RegExp('THE CHRONICLE<break type="paragraph" />', "g");
var articleIdPattern = new RegExp("\[^\]*<article><id>(\\d+)</id>\[^\]*", "g");
var sectionPattern = new RegExp("\[^\]*<section><id>[0-9]+</id><name>(.+?)</name></section>\[^\]*", "g");
var titlePattern = new RegExp("\[^\]*<text><inlineTag name=\"Root\">(.+?)</inlineTag></text>\[^\]*", "g");
var authorPattern = new RegExp("\[^\]*<metadata><name>Author</name><value><string>(.+?)</string></value></metadata>\[^\]*", "g");


db = new cradle.Connection('http://chrondev.iriscouch.com', 80, {
		    auth: { username: 'dean', password: 'dspc' }
		}).database('k4export')

exports.runExporter = runExporter;
exports.clearDatabase = clearDatabase;
exports.db = db;


function ArticleParser(articleCallback) {
    function onId(parser) {
	parser.article.id = parser.textNode;
    };
    function onSection(parser) {
	parser.article.section = parser.textNode;
    };
    function onMetadataType(parser) {
	parser.metadataType = parser.textNode;
    };
    function onMetadata(parser) {
	if (parser.metadataType == "Author")
	    parser.article.author = parser.textNode;
    };
    function onInlineTag(parser) {
	var tag = parser.tag;
	if (tag.attributes.name == "Root")
	    parser.article.title = parser.textNode;
	if (tag.attributes.name == "Story")
	    parser.article.body.push(parser.textNode);
    };
    function onTextBreak(parser) {
	var tag = parser.tags[parser.tags.length - 1];
	if (tag.attributes.name == "Story")
	    parser.article.body.push(parser.textNode);
    };

    var actions = {
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:ID": onId,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:SECTION:NAME": onSection,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:METADATA:NAME": onMetadataType,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:METADATA:VALUE:STRING": onMetadata,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:TEXTOBJECTS:TEXTOBJECT:TEXT:INLINETAG": onInlineTag,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:TEXTOBJECTS:TEXTOBJECT:TEXT:INLINETAG:BREAK": onTextBreak,
    };
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
                    thisParser.parseXML(data.toString(),
			function (err, article) {
			    if (err) callback(name);
			    else articleCallback(article, callback);
			});
                }
	    });
	}
	else {
	    console.error("Unknown file type: " + name);
	    callback(name);
	}
    };
    
    this.parseXML = function(xml, callback) {
	var article = { "body": [] };

	var parser = new sax.parser();
	parser.article = article;
	parser.ontext = function(text) {
	    async.reduceRight(parser.tags, parser.tag.name,
			      function(memo, item, cb) {
				  cb(undefined, item.name + ":" + memo);
			      },
			      function (err, result) {
				  var action = actions[result];
				  if (action != undefined)
				      action(parser);
			      });
	};
	parser.onend = function() {
	    try {
		if (article.body[0].match(/^by .*[^\.]$/i)) article.body.shift();
		if (article.body[0].match(/^from .*[^\.]/i)) article.body.shift();
		if (article.body[0].match(/^THE CHRONICLE$/)) article.body.shift();
	    } catch (err) {
		callback(err);
	    }
	    console.log(article);
	    callback("success");
	};
	parser.write(xml).close();
    }
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
