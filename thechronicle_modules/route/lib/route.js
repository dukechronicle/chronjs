var api = require('../../api');
var asereje = require('asereje');
var site = require('../../api/lib/site');


var MOBILE_BROWSER_USER_AGENTS = ["Android", "iPhone", "Windows Phone", "Blackberry", "Symbian", "Palm", "webOS"];

// assigns the functionality needed before different modules are ready to be
// initilized (before config settings have been set)
exports.assignPreInitFunctionality = function (app, runSite) {
    app.post('/login', function (req, res) {
	var body = req.body;
        api.accounts.login(req, body.username, body.password, function (err) {
            if (err)
		site.askForLogin(res, body.afterLogin, body.username, err);
            else
		res.redirect(req.body.afterLogin);
        });
    });

    app.get('/logout', function (req, res) {
        api.accounts.logout(req, function (err) {
            if (err) log.warning(err);
            res.redirect('/');
        });
    });

    app.get('/config', function (req, res) {
        if (api.accounts.isAdmin(req))
            site.renderConfigPage(res);
        else
            site.askForLogin(res, '/config');
    });

    app.post('/config', function (req, res) {
        if (api.accounts.isAdmin(req))
            config.setUp(req.body, function (err) {
                if (err)
		    site.renderConfigPage(res,err);
		else 
                    runSite(function (err) {
			if (err) log.error(err);
                        res.redirect('/');
                    });
            });
        else
	    site.askForLogin(res, '/config');
    });
};

exports.init = function (app) {

    // redirect mobile browsers to the mobile site
    app.get('/*', function(req, res, next) {
        var userAgent = req.headers['user-agent'];
        
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
    });

    app.get('/about-us', function (req, res) {
        res.render('pages/about-us', {
	    filename: 'pages/about-us',
	    css: asereje.css(['container/style'])
	});
    });

    app.get('/privacy-policy', function (req, res) {
        res.render('pages/privacy-policy', {
	    filename:'pages/privacy-policy',
	    css: asereje.css(['container/style'])
	});
    });

    app.get('/user-guidelines', function (req, res) {
        res.render('pages/user-guidelines', {
	    filename:'pages/user-guidelines',
	    css: asereje.css(['container/style'])
	});
    });

    app.get('/advertising', function (req, res) {
        res.render('pages/advertising', {
	    filename:'pages/advertising',
	    css: asereje.css()
	});
    });

    app.get('/subscribe', function (req, res) {
        res.render('pages/subscribe', {
	    filename:'pages/subscribe',
	    css: asereje.css()
	});
    });

    app.get('/edit-board', function (req, res) {
        res.render('pages/edit-board', {
	    filename:'pages/edit-board',
	    css: asereje.css()
	});
    });

    app.get('/letters-to-the-editor', function (req, res) {
        res.render('pages/letters', {
	    filename:'pages/letters',
	    css: asereje.css()
	});
    });

    app.get('/contact', function (req, res) {
        res.render('pages/contact', {
	    filename:'pages/contact',
	    css: asereje.css(['container/style'])
	});
    });

    app.get('/', function (req, res) {
        site.getFrontPageContent(function (err, model) {
            res.render('site/index', {
                css:asereje.css(['slideshow/style', 'container/style', 'site/frontpage']),
                filename:'views/site/index.jade',
                locals: {
                    model:model
                }
            });
        });
    });

    app.get('/news', function (req, res) {
        site.getNewsPageContent(function (err, model, children) {
            res.render('site/news', {
                css:asereje.css(['container/style', 'site/section', 'site/news']),
                subsections:children,
                filename:'views/site/news.jade',
                model:model
            });
        });
    });

    app.get('/sports', function (req, res) {
        site.getSportsPageContent(function (err, model, children) {
            res.render('site/sports', {
                css:asereje.css(['container/style', 'site/section', 'site/sports', 'slideshow/style']),
                subsections:[children.men, children.women],
                filename:'views/site/sports.jade',
                model:model
            });
        });
    });

    app.get('/opinion', function (req, res) {
        site.getOpinionPageContent(function (err, model, children) {
            res.render('site/opinion', {
                css:asereje.css(['container/style', 'site/section', 'site/opinion']),
                subsections:children,
                filename:'views/site/opinion.jade',
                model:model
            });
        });
    });

    app.get('/recess', function (req, res) {
        site.getRecessPageContent(function (err, model, children) {
            res.render('site/recess', {
                css:asereje.css(['container/style', 'site/section', 'site/recess']),
                subsections:children,
                filename:'views/site/recess.jade',
                model:model
            });
        });
    });

    app.get('/towerview', function (req, res) {
        site.getTowerviewPageContent(function (err, model, children) {
            res.render('site/towerview', {
                css:asereje.css(['container/style', 'site/section', 'site/towerview']),
                subsections:children,
                filename:'views/site/towerview.jade',
                model:model
            });
        });
    });

    app.get('/section/*', function (req, res) {
        var params = req.params.toString().split('/');
        site.getSectionContent(params, function (err, section, docs, children, parents, popular) {
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
        });
    });
    
    // Makes search url more readable
    app.get('/search', function (req, res) {
        var query = "--";            
        if (req.param('search') != null)
            query = req.param('search').replace(/ /g, '-');
        res.redirect('/search/' + query + '?sort=relevance&order=desc'); 
    });

    app.get('/search/:query', function (req, res) {
        var query = req.params.query.replace(/-/g, ' ');
        site.getSearchContent(query, req.query, function (err, docs, facets) {
            if (err) globalFunctions.showError(res, err);
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
    });

    app.get('/staff/:query', function (req, res) {
        var name = req.params.query.replace(/-/g, ' ');
        site.getAuthorContent(name, function (err, docs) {
	    res.render('site/people', {
                css:asereje.css(['container/style', 'site/people']),
                locals:{
                    docs: docs,
                    name: globalFunctions.capitalizeWords(name)
                }
            });
        });
    });

    app.get('/page/:url', function (req, res, next) {
        var url = req.params.url;
        site.getPageContent(url, function (err, doc, model) {
            if (err)
                next();
            else if ('/page/' + url != doc.path)
                res.redirect(doc.url);
            else res.render('page', {
		css: asereje.css(),
                filename:'views/page.jade',
                locals: {
                    doc:doc,
                    model: model
                }
            });
        });
    });

    app.get('/article/:url', function (req, res, next) {
        var url = req.params.url;
        var isAdmin = api.accounts.isAdmin(req);
        site.getArticleContent(url, function (err, doc, model, parents) {
            if (err)
                next();
            else if ('/article/' + url != doc.url)
                res.redirect(doc.url);
            else res.render('article', {
                locals: {
                    doc:doc,
                    isAdmin:isAdmin,
                    model:model,
                    parentPaths:parents
                },
                filename:'views/article',
                layout: 'layout-article',
                css:asereje.css(['container/style', 'article'])
            });
        });
    });

    app.get('/article/:url/print', function (req, res, next) {
        var url = req.params.url;
        site.getArticleContent(url, function (err, doc, model, parents) {
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
    });

    app.get('/article/:url/edit', site.checkAdmin, function (req, res) {
        var url = req.params.url;
        api.articleForUrl(url, function (err, doc) {
            if (err)
                globalFunctions.showError(http_res, err);
            else if (req.query.removeImage)
                api.image.removeVersionFromDocument(doc._id, null, req.query.removeImage, function(err, doc) {
                    if (err) globalFunctions.showError(res, err);
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
    });

    app.get('/page/:url/edit', site.checkAdmin, site.renderPageEdit = function (req, res) {
        var url = req.params.url;
        api.docForUrl(url, function (err, doc) {
            if (err) globalFunctions.showError(res, err);
            else res.render('admin/editPage', {
                locals: {
                    doc:doc
                }
            });
        });
    });

    app.get('/login', function (req, res) {
        site.askForLogin(res, '/');
    });

    app.get('/newsletter', function (req, res) {
        res.render('site/newsletter', {
	    filename: 'site/newsletter',
	    css: asereje.css()
	});
    });

    app.post('/newsletter', function (req, http_res) {
        var email = req.body.email;
        var action = req.body.action;

        var afterFunc = function() {
            http_res.render('site/newsletter', {
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
    });

    // Webmaster tools stuff -- don't delete
    app.get('/mu-7843c2b9-3b9490d6-8f535259-e645b756', function (req, res) {
        res.send('42');
    });

    //The 404 Route (ALWAYS Keep this as the last route)
    app.get('*', function(req, res) {
        res.render('pages/404', {
            filename: 'pages/404',
            css: asereje.css(['pages/style']),
	    status: 404,
            url: req.url
        });
    });
};