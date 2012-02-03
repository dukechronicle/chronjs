var api = require('../../api');
var admin = require('../../admin');
var log = require('../../log');
var mobileapi = require('../../mobileapi/lib/mobileapi');
var site = require('./site');

var async = require('async');


// assigns the functionality needed before different modules are ready to be
// initilized (before config settings have been set)
exports.preinit = function (app, runSite) {
    app.post('/login', site.loginData);
    app.get('/logout', site.logout);
    app.get('/config', site.config);
    app.post('/config', site.configData);
};

exports.init = function (app, callback) {

    // redirect mobile browsers to the mobile site
    app.get('/*', site.redirectMobile);
    app.get('/about-us', site.aboutUs);
    app.get('/privacy-policy', site.privacyPolicy);
    app.get('/user-guidelines', site.userGuidelines);
    app.get('/advertising', site.advertising);
    app.get('/subscribe', site.subscribe);
    app.get('/edit-board', site.editBoard);
    app.get('/letters-to-the-editor', site.lettersToEditor);
    app.get('/contact', site.contact);
    app.get('/', site.frontpage);
    app.get('/news', site.news);
    app.get('/sports', site.sports);
    app.get('/opinion', site.opinion);
    app.get('/recess', site.recess);
    app.get('/towerview', site.towerview);
    app.get('/section/*', site.section);

    // Makes search url more readable
    app.get('/search', function (req, res) {
        var query = "--";            
        if (req.param('search') != null)
            query = req.param('search').replace(/ /g, '-');
        res.redirect('/search/' + query + '?sort=relevance&order=desc'); 
    });

    app.get('/search/:query', site.search);
    app.get('/staff/:query', site.staff);
    app.get('/page/:url', site.page);
    app.get('/article/:url', site.article);
    app.get('/article/:url/print', site.articlePrint);
    app.get('/article/:url/edit', api.site.checkAdmin, site.editArticle);
    app.get('/page/:url/edit', api.site.checkAdmin, site.editPage);
    app.get('/login', site.login);
    app.get('/newsletter', site.newsletter);
    app.post('/newsletter', site.newsletterData);

    // Webmaster tools stuff -- don't delete
    app.get('/mu-7843c2b9-3b9490d6-8f535259-e645b756', function (req, res) {
        res.send('42');
    });

    async.parallel([
        function(cb) {
            admin.init(app, cb);
        },
        function(cb) {
            mobileapi.init(app, cb);
        }
    ], callback);

    //The 404 Route (ALWAYS Keep this as the last route)
    app.get('*', site.pageNotFound);

};