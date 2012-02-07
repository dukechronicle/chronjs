var site = exports;

var api = require('../../api');
var config = require('../../config');
var globalFunctions = require('../../global-functions');

var asereje = require('asereje');

var MOBILE_BROWSER_USER_AGENTS = ["Android", "iPhone", "Windows Phone",
                                  "Blackberry", "Symbian", "Palm", "webOS"];

var afterConfigChangeFunction = function(callback) { callback(); };

site.setAfterConfigChangeFunction = function(func) {
    afterConfigChangeFunction = func;
};

site.redirectMobile = function(req, res, next) {
    var userAgent = req.headers['user-agent'] || '';
        
    // only run the code below this line if they are not accessing the
    // mobile site            
    if(req.url.split('/',2)[1] == 'm') return next();
        
    for(var i in MOBILE_BROWSER_USER_AGENTS) {
        if(userAgent.indexOf(MOBILE_BROWSER_USER_AGENTS[i]) != -1) {
            res.redirect('/m');
            return;
        }
    }          
    next();
};

site.aboutUs = function (req, res) {
    res.render('pages/about-us', {
	filename: 'pages/about-us',
	css: asereje.css(['container/style'])
    });
};

site.privacyPolicy = function (req, res) {
    res.render('pages/privacy-policy', {
	filename:'pages/privacy-policy',
	css: asereje.css(['container/style'])
    });
};

site.userGuidelines = function (req, res) {
    res.render('pages/user-guidelines', {
	filename:'pages/user-guidelines',
	css: asereje.css(['container/style'])
    });
};

site.advertising = function (req, res) {
    res.render('pages/advertising', {
	filename:'pages/advertising',
	css: asereje.css()
    });
};

site.subscribe = function (req, res) {
    res.render('pages/subscribe', {
	filename:'pages/subscribe',
	css: asereje.css()
    });
};

site.editBoard = function (req, res) {
    res.render('pages/edit-board', {
	filename:'pages/edit-board',
	css: asereje.css()
    });
};

site.lettersToEditor = function (req, res) {
    res.render('pages/letters', {
	filename:'pages/letters',
	css: asereje.css()
    });
};

site.contact = function (req, res) {
    res.render('pages/contact', {
	filename:'pages/contact',
	css: asereje.css(['container/style'])
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
            css:asereje.css(['container/style', 'site/section', 'site/sports', 'slideshow/style']),
            subsections:[children.men, children.women],
            filename:'views/site/sports.jade',
            model:model
        });
    });
};

site.opinion = function (req, res) {
    api.site.getOpinionPageContent(function (err, model, children) {
        res.render('site/opinion', {
            css:asereje.css(['container/style', 'site/section', 'site/opinion']),
            subsections:children,
            filename:'views/site/opinion.jade',
            model:model
        });
    });
};

site.recess = function (req, res) {
    api.site.getRecessPageContent(function (err, model, children) {
        res.render('site/recess', {
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
                doc:doc,
                model: model
            }
        });
    });
};

site.article = function (req, res, next) {
    var url = req.params.url;
    var isAdmin = api.accounts.isAdmin(req);
    api.site.getArticleContent(url, function (err, doc, model, parents) {
        if (err)
            next();
        else if ('/article/' + url != doc.url)
            res.redirect(doc.url);
        else res.render('article', {
            locals: {
                doc:doc,
                isAdmin:isAdmin,
                model:model,
                parentPaths:parents,
                isProduction: (process.env.NODE_ENV === 'production'),
                disqusShortname: config.get('DISQUS_SHORTNAME')
            },
            filename:'views/article',
            layout: 'layout-article',
            css:asereje.css(['container/style', 'article'])
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
    api.docForUrl(url, function (err, doc) {
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
        api.site.renderConfigPage(res);
    else
        api.site.askForLogin(res, '/config');
};

site.configData = function (req, res) {
    if (api.accounts.isAdmin(req))
        config.setUp(req.body, function (err) {
            if (err)
		        api.site.renderConfigPage(res,err);
	        else 
                afterConfigChangeFunction(function (err) {
		            if (err) log.error(err);
                    res.redirect('/');
                });
        });
    else
	    api.site.askForLogin(res, '/config');
};

site.newsletter = function (req, res) {
    res.render('site/newsletter', {
	filename: 'site/newsletter',
	css: asereje.css()
    });
};

site.newsletterData = function (req, res) {
    var email = req.body.email;
    var action = req.body.action;

    var afterFunc = function() {
        res.render('site/newsletter', {
            email: email,
            action: action,
	    css: asereje.css()
        });
    };
    
    if (action == "subscribe")
        api.newsletter.addSubscriber(email, afterFunc);
    else if(action == "unsubscribe")
        api.newsletter.removeSubscriber(email, afterFunc);
    else
        afterFunc();
};

site.pageNotFound = function(req, res) {
    res.render('pages/404', {
        filename: 'pages/404',
        css: asereje.css(['pages/style']),
	status: 404,
        url: req.url
    });
};
