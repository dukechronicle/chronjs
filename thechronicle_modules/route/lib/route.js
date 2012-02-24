var api = require('../../api');
var admin = require('../../admin');
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
        app.get('/:section', siteApi.section);
        app.get('/article/:url', siteApi.article);
        app.get('/search/:query', siteApi.search);
        app.get('/staff/:query', siteApi.staff);

        app.post('/article/edit', api.site.checkAdmin, siteApi.editDocument);
        app.post('/group/add', api.site.checkAdmin, siteApi.addGroup);
        app.post('/group/remove', api.site.checkAdmin, siteApi.removeGroup);
        app.del('/:docId', api.site.checkAdmin, siteApi.deleteDocument);
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

    app.get('/page/:url', site.page);
    app.get('/page/:url/edit', api.site.checkAdmin, site.editPage);
    app.get('/article/:url', site.article);
    app.get('/article/:url/print', site.articlePrint);
    app.get('/article/:url/edit', api.site.checkAdmin, site.editArticle);
    app.get('/login', site.login);
    app.get('/newsletter', site.newsletter);
    app.post('/newsletter', site.newsletterData);

    // Webmaster tools stuff -- don't delete
    app.get('/mu-7843c2b9-3b9490d6-8f535259-e645b756', function (req, res) {
        res.send('42');
    });

    app.namespace('/admin', function () {
        app.get('/', api.site.checkAdmin, admin.index);
        app.get('/newsletter', api.site.checkAdmin, admin.newsletter);
        app.get('/add', api.site.checkAdmin, admin.addArticle);
        app.get('/add-page', api.site.checkAdmin, admin.addPage);
        app.get('/manage', api.site.checkAdmin, admin.manage);
        app.get('/k4export', api.site.checkAdmin, admin.k4export);
        app.post('/k4export', api.site.checkAdmin, admin.k4exportData);
        app.post('/edit', api.site.checkAdmin, admin.editArticleData);
        app.post('/add', api.site.checkAdmin, admin.addArticleData);
        app.post('/addPage', api.site.checkAdmin, admin.addPageData);
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
