var admin = exports;

var adminApi = require('../../admin');
var api = require('../../api');
var config = require('../../config');
var log = require('../../log');
var util = require('../../util');

admin.image = adminApi.image;

admin.duplicates = function (req, res, next) {
    var db = api.getDatabaseName();
    var host = api.getDatabaseHost();
    var port = api.getDatabasePort() || "80";
    var db_url = 'http://' + host + ':' + port + '/_utils/document.html?' + db;

    api.article.getDuplicates(50, function(err, duplicateDocs) {
        if (err) next(err);
        else {
            res.render('admin/article/duplicates', {
                layout: 'admin/layout',
                locals:{
                    docs: duplicateDocs,
                    hasPrevious: false,
                    db_url: db_url
                }
            });
        }
    });
}

admin.author = function (req, res, next) {
    var name = req.query.name;
    if (name) {
        res.redirect('/staff/' + name + '/edit');
    }
    else {
        res.render('admin/author', {
            layout: 'admin/layout'
        });
    }
};

admin.editAuthor = function (req, res, next) {
    var name = req.params.name;
    api.authors.getInfo(name, function (err, docs) {
        var doc = docs.length == 0 ? {name: name} : docs[0];
        res.render('admin/author/edit', {
            layout: 'admin/layout',
            locals: { doc: doc }
        });
    });
};

admin.editAuthorData = function (req, res, next) {
    api.authors.setInfo(req.body, function (err, response) {
        if (err) next(err);
        else res.redirect('/admin/author?name=' + req.body.name);
    });
};

admin.index = function (req, res, next) {
    res.render('admin');
};

admin.newsletter = function (req, res, next) {
    api.newsletter.createNewsletter(function(err, campaignID) {
        if (err) next(err);
        else {
            res.render('admin/newsletter', {
                locals: {campaignID: campaignID}
            });
        }
    });
};

admin.newsletterData = function(req, res, next) {
    var testEmail = req.body.testEmail;
    var campaignId = req.body.campaignID;
    adminApi.sendNewsletter(testEmail, campaignId, function (err) {
        if (err) res.send(err);
        else res.send("sent");
    });
};

admin.manage = function (req, res, next) {
    var db = api.getDatabaseName();
    var host = api.getDatabaseHost();
    var port = api.getDatabasePort() || "80";
    var db_url = 'http://' + host + ':' + port + '/_utils/document.html?' + db;

    var query = {};
    if (req.query.beforeKey) query.startkey = parseInt(req.query.beforeKey);
    if (req.query.beforeID) query.start_docid = req.query.beforeID;

    api.docsByDate(null, query, function (err, docs) {
        if (err) next(err);
        else res.render('admin/article', {
            layout: 'admin/layout',
            locals:{
                docs:docs,
                hasPrevious:(req.query.beforeID != null),
                db_url: db_url
            }
        });
    });
};


admin.k4export = function (req, res, next) {
    res.render('admin/k4export', {
        locals:{
            failed:null,
            succeeded:null,
            taxonomy:null
        }
    });
};

admin.k4exportData = function (req, res, next) {
    adminApi.k4export(req.files.zip.path, function(err, results) {
        res.render('admin/k4export', {
            locals:{
                failed: results.k4.failed,
                succeeded: results.k4.success,
                taxonomy: results.taxonomy,
                imageData: results.images
        }
        });
    });
};

admin.addArticle = function (req, res, next) {
    api.taxonomy.getTaxonomyListing(function (err, taxonomy) {
        res.render('admin/article/new', {
            layout: 'admin/layout',
            locals:{
                groups:[],
                taxonomy:taxonomy
            }
        });
    });
};

admin.addArticleData = function (req, res, next) {
    adminApi.addArticle(req.body.doc, function (err, url) {
        if (err) next(err);
        else res.redirect('/article/' + url);
    });
};

admin.editArticle = function (req, res, next) {
    var url = req.params.url;
    api.articleForUrl(url, function (err, doc) {
        if (err)
            next(err);
        else
            api.taxonomy.getTaxonomyListing(function(err, taxonomy) {
                if (doc.authors)
                    doc.authors = doc.authors.join(", ");

                res.render('admin/article/edit', {
                    layout: 'admin/layout',
                    locals:{
                        doc:doc,
                        groups:[],
                        taxonomy:taxonomy
                    }
                });
            });
    });
};

admin.editArticleData = function (req, res, next) {
    adminApi.editArticle(req.body.doc, function (err, url) {
        if (err) next(err);
        else res.redirect('/article/' + url);
    });
};

admin.layout = function (req, res, next) {
    var section = req.query.section;
    var group = util.capitalizeWords(req.params.group);
    var layoutConfig = api.group.getLayoutGroups();
    adminApi.layout(section, group, layoutConfig, function (err, results) {
        if (err) next(err);
        else {
            res.render("admin/page-layout", {
                locals:{
                    page: group,
                    groups: layoutConfig[group].groups,
                    mainSections: config.get("TAXONOMY_MAIN_SECTIONS"),
                    sectionDocs: results.sectionDocs,
                    groupDocs: results.groupDocs,
                    nameSpace: layoutConfig[group].namespace
                }
            });      
        }
    });
};

admin.memory = function (req, res, next) {
    var megabyte = 1048576;
    var usage = process.memoryUsage();
    res.send("rss: " + Math.round(usage.rss/megabyte) + " MB<br />" +
        "heapTotal: " + Math.round(usage.heapTotal/megabyte) + " MB<br />" +
        "heapUsed: " + Math.round(usage.heapUsed/megabyte) + " MB<br />"
    );
}
