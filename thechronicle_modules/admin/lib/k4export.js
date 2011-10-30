var child_process = require('child_process')
var cradle = require('cradle');
var fs  = require('fs');
var path = require('path');
var api = require('../../api')
var async = require('async')
var sax = require('sax')
var zipfile = require('zipfile')


db = new cradle.Connection('http://app578498.heroku.cloudant.com', 80, {
		    auth: { username: 'app578498.heroku',
			    password: 'NNbL2x3Bu5vGLgComPjWxxET' }
                    }).database('chronicle_dev');

exports.runExporter = runExporter;
exports.clearDatabase = clearDatabase;


function ArticleParser(articleCallback) {
    var thisParser = this;
    var endWhitespace = /^\s+|\s+$/g;
    var actions = {
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:ID": onId,
	"K4EXPORT:PUBLICATION:ISSUE:PUBLICATIONDATE": onDate,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:SECTION:NAME": onSection,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:METADATA:NAME": onMetadataType,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:METADATA:VALUE:STRING": onMetadata,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:TEXTOBJECTS:TEXTOBJECT:TEXT:INLINETAG": onInlineTag,
	"K4EXPORT:PUBLICATION:ISSUE:ARTICLE:TEXTOBJECTS:TEXTOBJECT:TEXT:INLINETAG:BREAK": onTextBreak,
    };

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
			if (err) failed.push(err);
			else     succeed.push(title);
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
	var parser = new sax.parser();
	parser.article = { body: [],
			   type: 'article',
			   publish: false
			 };
	parser.ontext = function(text) {
	    parser.textNode = text.replace(endWhitespace, '');
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
	parser.onend = function () {
	    fixArticle(parser.article, callback);
	}
	parser.write(xml).close();
    }

    function fixArticle(article, callback) {
	try {
	    if (article.body[0].match(/^by [^\.]*$/i)) article.body.shift();
	    if (article.body[0].match(/^from [^\.]*$/i)) article.body.shift();
	    if (article.body[0].match(/^THE CHRONICLE$/)) article.body.shift();
	    article.teaser = article.body[0];
	} catch (err) {
	    callback(err);
	    return;
	}
	async.reduce(article.body, "",
		     function(memo, item, cb) {
			 cb(undefined, memo + "<p>" + item + "</p>");
		     },
		     function(err, result) {
			 if (err)
			     callback(err);
			 else {
			     article.body = result;
			     callback(undefined, article);
			 }
		     });
    }

    function onId(parser) {
	parser.article.import_id = parser.textNode;
    };
    function onSection(parser) {
	parser.article.taxonomy = [ parser.textNode ];
    };
    function onDate(parser) {
	var date = new Date(parser.textNode);
	parser.article.publish_time = date.getTime() / 1000;
    };
    function onMetadataType(parser) {
	parser.metadataType = parser.textNode;
    };
    function onMetadata(parser) {
	if (parser.metadataType == "Author") {
	    async.map(parser.textNode.split(/\,\s*and\s|\sand\s|\,/),
		      function (name, cb) {
			  cb(undefined, name.replace(endWhitespace));
		      },
		      function (err, results) {
			  parser.article.authors = results;
		      });
	}
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
}

function exportToDevelopment(article, callback) {
    db.save(article, callback);
}

function exportToProduction(article, callback) {
    api.addDoc(article, callback);
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
	exportToProduction(article, function(err, url) {
	    if (err) {
		console.error("Error adding article: " + err);
		callback(article.title);
	    }
	    else {
		article.url = url;
		callback(undefined, article);
	    }
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
