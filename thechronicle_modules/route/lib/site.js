var site = exports;

var api = require('../../api');
var config = require('../../config');
var log = require('../../log');
var util = require('../../util');

var fs = require('fs');
var _ = require('underscore');


site.mobile = function (req, res, next) {
    res.render('mobile', {
        layout: false
    });
};

site.frontpage = function (req, res) {
    api.site.getFrontPageContent(function (err, model) {
        res.render('site/pages/frontpage', {
            layout: 'site/layout',
            locals: {
                model:model,
                frontpage: true
            }
        });
    });
};

site.news = function (req, res) {
    api.site.getNewsPageContent(function (err, model, children) {
        res.render('site/pages/news', {
            layout: 'site/layout',
            pageTitle: "News",
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
        res.render('site/pages/sports', {
            layout: 'site/layout',
            pageTitle: "Sports",
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
        res.render('site/pages/opinion', {
            layout: 'site/layout',
            pageTitle: "Opinion",
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
        res.render('site/pages/recess', {
            layout: 'site/layout',
            pageTitle: "Recess",
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
        res.render('site/pages/towerview', {
            layout: 'site/layout',
            pageTitle: "Towerview",
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
    api.site.getSectionContent(sectionArray, function (err, section, docs, nextDoc, children, parents, popular) {
        if (err) next();
        else {
            res.render('site/pages/section', {
                layout: 'site/layout',
                locals: {
                    pageTitle: section,
                    docs:docs,
                    next:nextDoc,
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
    var query = req.query.q.replace(/-/g, ' ');
    api.site.getSearchContent(query, req.query, function (err, docs, facets) {
        if (err) next(err);
        else res.render('site/pages/search', {
            layout: 'site/layout',
            locals: {
                docs: docs,
                currentFacets: req.query.facets || '',
                facets: facets,
                query: req.query.q,
                sort: req.query.sort,
                order: req.query.order
            }
        });
    });
};

site.staff = function (req, res) {
    var name = req.params.query.replace(/-/g, ' ');
    api.site.getAuthorContent(name, function (err, docs, info) {
        res.render('site/pages/people', {
            layout: 'site/layout',
            locals: {
                pageTitle: util.capitalizeWords(name),
                docs: docs,
                name: util.capitalizeWords(name), 
                authorInfo: info
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
                article: true,
                disqusData: {
                    production: process.env.NODE_ENV == 'production',
                    shortname: config.get('DISQUS_SHORTNAME'),
                    id: doc.nid || doc._id,
                    title: doc.title,
                    url: doc.url
                }
            };

            if (doc.images.ThumbSquareM)
                locals.pageImage = doc.images.ThumbSquareM.url;

            res.render('site/pages/article', {
                layout: 'site/layout',
                locals: locals
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
            res.render('print/article', {
                locals: {
                    doc:doc
                }
            });
        }
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
        res.render('site/pages/newsletter', {
            layout: 'site/layout',
            locals: {
                email: email,
                action: action
            }
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
                layout: false,
                locals: {
                    docs: docs,
                    section: []
                }
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
                layout: false,
                locals: {
                    docs: docs,
                    section: taxonomy
                }
            });
        }
    });
};

site.staticPage = function (req, res, next) {
    var url = _.last(req.route.path.split('/'));
    var filename = 'site/pages/' + url;
    fs.readFile('views/site/pages/page-data/' + url + '.json', function (err, data) {
        var data = (!err && data) ? JSON.parse(data.toString()) : null;
        res.render(filename, {
            layout: 'site/layout',
            data: data
        });
    });
};

site.pageNotFound = function(req, res) {
    res.render('site/pages/404', {
        layout: 'site/layout',
    status: 404,
        url: req.url
    });
};
