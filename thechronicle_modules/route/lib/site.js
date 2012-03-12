var site = exports;

var api = require('../../api');
var config = require('../../config');
var globalFunctions = require('../../global-functions');
var log = require('../../log');

var asereje = require('asereje');
var fs = require('fs');
var _ = require('underscore');


site.mobile = function (req, res, next) {
    res.sendfile('public/m/index.html');
};

site.poll = function (req, res, next) {
    api.poll.getPoll('8f094837374829e664dc4ea896015695', function (err, doc) {
        res.render('container/poll', {
            js: ['poll'],
            css: asereje.css(['container/style', 'container/poll']),
            locals: { poll: doc }
        });
    }); 
};

site.frontpage = function (req, res) {
    api.site.getFrontPageContent(function (err, model) {
        res.render('site/index', {
            css:asereje.css(['slideshow/style', 'container/style', 'site/frontpage']),
            js:['slideshow/frontpage-slideshow'],
            filename:'views/site/index.jade',
            locals: {
                model:model
            }
        });
    });
};

site.news = function (req, res) {
    api.site.getNewsPageContent(function (err, model, children) {
        res.render('site/news', {
            pageTitle: "News",
            css:asereje.css(['container/style', 'site/section', 'site/news']),
            subsections:children,
            filename:'views/site/news.jade',
            model:model
        });
    });
};

site.sports = function (req, res) {
    api.site.getSportsPageContent(function (err, model, children) {
        res.render('site/sports', {
            pageTitle: "Sports",
            css:asereje.css(['container/style', 'site/section', 'site/sports', 'slideshow/style']),
            js:['slideshow/slideshow'],
            subsections:[children.men, children.women],
            filename:'views/site/sports.jade',
            model:model
        });
    });
};

site.opinion = function (req, res) {
    api.site.getOpinionPageContent(function (err, model, children) {
        res.render('site/opinion', {
            pageTitle: "Opinion",
            css:asereje.css(['container/style', 'site/section', 'site/opinion']),
            js:['opinion'],
            subsections:children,
            filename:'views/site/opinion.jade',
            model:model
        });
    });
};

site.recess = function (req, res) {
    api.site.getRecessPageContent(function (err, model, children) {
        res.render('site/recess', {
            pageTitle: "Recess",
            css:asereje.css(['container/style', 'site/section', 'site/recess']),
            subsections:children,
            filename:'views/site/recess.jade',
            model:model
        });
    });
};

site.towerview = function (req, res) {
    api.site.getTowerviewPageContent(function (err, model, children) {
        res.render('site/towerview', {
            pageTitle: "Towerview",
            css:asereje.css(['container/style', 'site/section', 'site/towerview']),
            subsections:children,
            filename:'views/site/towerview.jade',
            model:model
        });
    });
};

site.section = function (req, res, next) {
    var params = req.params.toString().split('/');
    api.site.getSectionContent(params, function (err, section, docs, children, parents, popular) {
        if (err) next();
        else {
	    res.render('site/section', {
	        css:asereje.css(['container/style', 'site/section']),
	        locals: {
                pageTitle: section,
                docs:docs,
                subsections:children,
                parentPaths:parents,
                section:section,
                popular: popular
	        }
	    });
        }
    });
};

site.search = function (req, res, next) {
    var query = req.params.query.replace(/-/g, ' ');
    api.site.getSearchContent(query, req.query, function (err, docs, facets) {
        if (err) next(err);
        else res.render('site/search', {
            css:asereje.css(['container/style', 'site/search']),
            js:['scrollLoad?v=2'],
            locals: {
                docs: docs,
                currentFacets: req.query.facets || '',
                facets: facets,
                query: req.params.query,
                sort: req.query.sort,
                order: req.query.order
            }
        });
    });
};

site.staff = function (req, res) {
    var name = req.params.query.replace(/-/g, ' ');
    api.site.getAuthorContent(name, function (err, docs) {
	res.render('site/people', {
            css:asereje.css(['container/style', 'site/people']),
            js:['scrollLoad?v=2'],
            locals:{
                pageTitle: globalFunctions.capitalizeWords(name),
                docs: docs,
                name: globalFunctions.capitalizeWords(name)
            }
        });
    });
};

site.page = function (req, res, next) {
    var url = req.params.url;
    api.site.getPageContent(url, function (err, doc, model) {
        if (err)
            next();
        else if ('/page/' + url != doc.path)
            res.redirect(doc.url);
        else res.render('page', {
	        css: asereje.css(['container/style']),
            filename:'views/page.jade',
            locals: {
                pageTitle: doc.node_title,
                doc:doc,
                model: model
            }
        });
    });
};

site.article = function (req, res, next) {
    var url = req.params.url;
    var isAdmin = api.accounts.isAdmin(req);
    // cache article pages for an hour
    if (!isAdmin) res.header('Cache-Control', 'public, max-age=3600');

    api.site.getArticleContent(url, function (err, doc, model, parents) {
        if (err)
            next();
        else if ('/article/' + url != doc.url)
            res.redirect(doc.url);
        else res.render('article', {
            locals: {
                doc:doc,
                pageTitle:doc.title,
                isAdmin:isAdmin,
                model:model,
                parentPaths:parents,
                isProduction: (process.env.NODE_ENV === 'production'),
                disqusShortname: config.get('DISQUS_SHORTNAME')
            },
            filename:'views/article',
            css:asereje.css(['container/style', 'article']),
            js:['disqus?v=4']
        });
    });
};

site.articlePrint = function (req, res, next) {
    var url = req.params.url;
    api.site.getArticleContent(url, function (err, doc, model, parents) {
        if (err)
            next();
        else if ('/article/' + url != doc.url)
            res.redirect(doc.url + '/print');
        else {
            doc.url += '/print';
            doc.fullUrl += '/print';
            res.render('article-print', {
		css: asereje.css(),
                filename:'views/article-print.jade',
                layout:"layout-print.jade",
                locals: {
                    doc:doc
                }
            });
        }
    });
};

site.editArticle = function (req, res, next) {
    var url = req.params.url;
    api.articleForUrl(url, function (err, doc) {
        if (err)
            next(err);
        else if (req.query.removeImage)
            api.image.removeVersionFromDocument(doc._id, null, req.query.removeImage, function(err, doc) {
                if (err) next(err);
                else res.redirect('/article/' + url + '/edit');
            });
        else
            api.taxonomy.getTaxonomyListing(function(err, taxonomy) {
                if (doc.authors)
                    doc.authors = doc.authors.join(", ");

                res.render('admin/edit', {
                    js:['admin/deleteArticle'],
                    locals:{
                        doc:doc,
                        groups:[],
                        images:doc.images || {},
                        url:url,
                        afterAddImageUrl: '/article/' + url + '/edit',
                        taxonomy:taxonomy
                    }
                });
            });
    });
};

site.editPage = function (req, res, next) {
    var url = req.params.url;
    api.page.getByUrl(url, function (err, doc) {
        if (err) next(err);
        else res.render('admin/editPage', {
            locals: {
                doc:doc
            }
        });
    });
};

site.login = function (req, res) {
    api.site.askForLogin(res, '/');
};

site.loginData = function (req, res) {
    var body = req.body;
    api.accounts.login(req, body.username, body.password, function (err) {
        if (err)
	    api.site.askForLogin(res, body.afterLogin, body.username, err);
        else
	    res.redirect(req.body.afterLogin);
    });
};

site.logout = function (req, res) {
    api.accounts.logout(req, function (err) {
        if (err) log.warning(err);
        res.redirect('/');
    });
};

site.config = function (req, res) {
    if (api.accounts.isAdmin(req))
        api.site.renderConfigPage(req, res);
    else
        api.site.askForLogin(res, '/config');
};

site.configData = function (req, res) {
    if (api.accounts.isAdmin(req))
        config.setUp(req.body, function (err) {
            if (err)
		        api.site.renderConfigPage(req, res, err);
	        else {
                log.notice("Config updated to use revision " + config.getConfigRevision());
                config.runAfterConfigChangeFunction(function (err) {
		            if (err) log.error(err);
                    res.redirect('/');
                });
            }   
        });
    else
	    api.site.askForLogin(res, '/config');
};

site.newsletter = function (req, res) {
    res.render('pages/newsletter', {
	filename: 'pages/newsletter',
	css: asereje.css(['container/style'])
    });
};

site.newsletterData = function (req, res) {
    var email = req.body.email;
    var action = req.body.action;

    var afterFunc = function() {
        res.render('pages/newsletter', {
	    filename: 'pages/newsletter',
            email: email,
            action: action,
	    css: asereje.css(['container/style'])
        });
    };
    
    if (action == "subscribe")
        api.newsletter.addSubscriber(email, afterFunc);
    else if(action == "unsubscribe")
        api.newsletter.removeSubscriber(email, afterFunc);
    else
        afterFunc();
};

site.rss = function (req, res, next) {
    api.docsByDate(50, null, function (err, docs) {
        if (err) next(err);
        else {
            res.render('rss', {
                docs: docs,
                section: [],
                layout: false,
                filename: 'rss'
            });
        }
    });
};

site.rssSection = function (req, res, next) {
    var taxonomy = req.params.toString().split('/');
    api.taxonomy.docs(taxonomy, 50, null, function (err, docs) {
        if (err) next(err);
        else {
            res.render('rss', {
                docs: docs,
                section: taxonomy,
                layout: false,
                filename: 'rss'
            });
        }
    });
};

site.staticPage = function (req, res, next) {
    var url = _.last(req.route.path.split('/'));
    var filename = 'pages/' + url;
    fs.readFile('views/pages/page-data/' + url + '.json', function (err, data) {
        var data = (!err && data) ? JSON.parse(data.toString()) : null;
        res.render(filename, {
	    css: asereje.css(['container/style', filename]),
            filename: filename,
            data: data
        });
    });
};

site.pageNotFound = function(req, res) {
    res.render('pages/404', {
        filename: 'pages/404',
        css: asereje.css([]),
	status: 404,
        url: req.url
    });
};
