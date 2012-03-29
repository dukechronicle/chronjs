var site = exports;

var api = require('../../api');
var config = require('../../config');
var globalFunctions = require('../../global-functions');
var log = require('../../log');

var asereje = require('asereje');
var fs = require('fs');
var _ = require('underscore');


site.mobile = function (req, res, next) {
    res.render('site/mobile', {
        layout:false
        //filename:'views/site/mobile.jade',
    });    
};

site.frontpage = function (req, res) {
    api.site.getFrontPageContent(function (err, model) {
        res.render('site/index', {
            css:asereje.css(['slideshow/style', 'container/style', 'site/frontpage']),
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
            filename:'views/site/news.jade',
            locals: {
                subsections:children,
                section: 'News',
                model:model
            }
        });
    });
};

site.sports = function (req, res) {
    api.site.getSportsPageContent(function (err, model, children) {
        res.render('site/sports', {
            pageTitle: "Sports",
            css:asereje.css(['container/style', 'site/section', 'site/sports', 'slideshow/style']),
            filename:'views/site/sports.jade',
            locals: {
                subsections: children,
                model:model,
                section: 'Sports'
            }
        });
    });
};

site.opinion = function (req, res) {
    api.site.getOpinionPageContent(function (err, model, children) {
        res.render('site/opinion', {
            pageTitle: "Opinion",
            css:asereje.css(['container/style', 'site/section', 'site/opinion']),
            filename:'views/site/opinion.jade',
            locals: {
                subsections:children,
                section: 'Opinion',
                model:model
            }
        });
    });
};

site.recess = function (req, res) {
    api.site.getRecessPageContent(function (err, model, children) {
        res.render('site/recess', {
            pageTitle: "Recess",
            css:asereje.css(['container/style', 'site/section', 'site/recess']),
            filename:'views/site/recess.jade',
            locals: {
                subsections:children,
                section: 'Recess',
                model:model
            }
        });
    });
};

site.towerview = function (req, res) {
    api.site.getTowerviewPageContent(function (err, model, children) {
        res.render('site/towerview', {
            pageTitle: "Towerview",
            css:asereje.css(['container/style', 'site/section', 'site/towerview']),
            filename:'views/site/towerview.jade',
            locals: {
                subsections:children,
                section: 'Towerview',
                model:model
            }
        });
    });
};

site.section = function (req, res, next) {
    var sectionArray = req.params.toString().split('/');
    api.site.getSectionContent(sectionArray, function (err, section, docs, children, parents, popular) {
        if (err) next();
        else {
	    res.render('site/section', {
	        css:asereje.css(['container/style', 'site/section']),
	        locals: {
                pageTitle: section,
                docs:docs,
                subsections:children,
                parentPaths:parents,
                section: sectionArray[0],
                popular: popular,
                taxonomyPath: sectionArray.join('/')
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

    api.site.getArticleContent(url, function (err, doc, model) {
        if (err === 'not found')
            next();
        else if (err)
            next(err);
        else if ('/article/' + url != doc.url)
            res.redirect(doc.url);
        else {
            var locals = {
                doc:doc,
                pageTitle: doc.title,
                isAdmin:isAdmin,
                model:model,
                parentPaths: model.parents,
                section: doc.taxonomy[0],
                disqusData: {
                    shortname: config.get('DISQUS_SHORTNAME'),
                    id: doc.nid || doc._id,
                    title: doc.title,
                    url: doc.url
                }
            };

            if (doc.images.ThumbSquareM)
                locals.pageImage = doc.images.ThumbSquareM.url;
            if (model.poll && req.session.polls &&
                model.poll._id in req.session.polls)
                model.poll.voted = true;

            res.render('article', {
                locals: locals,
                filename:'views/article',
                css:asereje.css(['container/style', 'article', 'container/poll'])
            });
        }
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
