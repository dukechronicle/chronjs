var api = require('../../api');
var admin = require('./admin');
var siteApi = require('./api');
var log = require('../../log');
var site = require('./site');

var async = require('async');


// assigns the functionality needed before different modules are ready to be
// initilized (before config settings have been set)
exports.preinit = function (app) {
    app.post('/login', site.loginData);
    app.get('/logout', site.logout);
    app.get('/config', site.config);
    app.post('/config', site.configData);
};

exports.init = function (app) {

    app.namespace('/api', function () {
        app.get('/all', siteApi.listAll);
        app.get('/section/*', siteApi.listSection);
        app.get('/article/url/:url', siteApi.articleByUrl);
        app.get('/search/:query', siteApi.search);
        app.get('/staff/:query', siteApi.staff);

        app.post('/poll/vote', siteApi.votePoll);
        app.get('/article/:id', siteApi.readArticle);
        app.post('/article', api.site.checkAdmin, siteApi.createArticle);
        app.put('/article/:id', api.site.checkAdmin, siteApi.updateArticle);
        app.del('/article/:id', api.site.checkAdmin, siteApi.deleteArticle);
    });

    app.get('/m/*', site.mobile);

    app.get('/', site.frontpage);
    app.get('/news', site.news);
    app.get('/sports', site.sports);
    app.get('/opinion', site.opinion);
    app.get('/recess', site.recess);
    app.get('/towerview', site.towerview);
    app.get('/section/*', site.section);

    app.get('/rss-source', site.rss);
    app.get('/rss-source/*', site.rssSection);
    app.get('/feed/all', redirect("/rss"));
    app.get('/rss', redirect("http://feeds.feedburner.com/thechronicle/all"));
    app.get('/rss/news', redirect("http://feeds.feedburner.com/thechronicle/news"));

    app.namespace('/page', function () {
        app.get('/about-us', site.staticPage);
        app.get('/advertising', site.staticPage);
        app.get('/contact', site.staticPage);
        app.get('/edit-board', site.staticPage);
        app.get('/graduation', site.staticPage)
        app.get('/letters', site.staticPage);
        app.get('/newsletter', site.staticPage);
        app.get('/privacy-policy', site.staticPage);
        app.get('/subscribe', site.staticPage);
        app.get('/user-guidelines', site.staticPage);
        app.get('/young-trustee-2012', site.staticPage);
        
        app.post('/newsletter', site.newsletterData);
    });

    app.get('/graduation', redirect('/page/graduation'));

    // Makes search url more readable
    app.get('/search', function (req, res) {
        var query = "--";            
        if (req.param('search') != null)
            query = req.param('search').replace(/ /g, '-');
        res.redirect('/search/' + query + '?sort=relevance&order=desc'); 
    });
    app.get('/search/:query', site.search);

    app.get('/users/:query', function (req, res) {
        res.redirect('/staff/' + req.params.query);
    });
    app.get('/staff/:query', site.staff);

    app.get('/login', site.login);

    // Webmaster tools stuff -- don't delete
    app.get('/mu-7843c2b9-3b9490d6-8f535259-e645b756', function (req, res) {
        res.send('42');
    });

    app.namespace('/article', function () {
        app.get('/:url', site.article);
        app.get('/:url/print', site.articlePrint);
        app.get('/:url/edit', api.site.checkAdmin, site.editArticle);
        app.get('/new', api.site.checkAdmin, admin.addArticle);
        app.post('/', api.site.checkAdmin, admin.addArticleData);
        app.put('/:url/edit', api.site.checkAdmin, admin.editArticleData);
    });

    app.namespace('/admin', function () {
        app.get('/', api.site.checkAdmin, admin.index);
        app.get('/newsletter', api.site.checkAdmin, admin.newsletter);
        app.get('/manage', api.site.checkAdmin, admin.manage);
        app.get('/k4export', api.site.checkAdmin, admin.k4export);
        app.post('/k4export', api.site.checkAdmin, admin.k4exportData);
        app.post('/newsletter', api.site.checkAdmin, admin.newsletterData);
        app.get('/layout/group/:group', api.site.checkAdmin, admin.layout);
    });
    
    app.namespace('/admin/image', function () {
        app.get('/manage', api.site.checkAdmin, admin.image.manage);
        app.get('/upload', api.site.checkAdmin, admin.image.upload);
        app.post('/upload', api.site.checkAdmin, admin.image.uploadData);
        app.get('/articles', api.site.checkAdmin, admin.image.articles);
        app.get('/delete', api.site.checkAdmin, admin.image.deleteImage);
        app.get('/:imageName', api.site.checkAdmin, admin.image.renderImage);
        app.post('/info', api.site.checkAdmin, admin.image.info);
        app.post('/crop', api.site.checkAdmin, admin.image.crop);
    });
    
    //The 404 Route (ALWAYS Keep this as the last route)
    app.get('*', site.pageNotFound);

};

function redirect (url) {
    return function(req, res) {
        res.redirect(url, 301);
    }
}
