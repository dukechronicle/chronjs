var site = require('../../api/lib/site.js');
var api = require('../../api');

var FRONTPAGE_GROUP_NAMESPACE = ['Layouts','Frontpage'];
var NEWS_GROUP_NAMESPACE = ['Layouts','News'];
var SPORTS_GROUP_NAMESPACE = ['Layouts','Sports'];
var OPINION_GROUP_NAMESPACE = ['Layouts','Opinion'];
var RECESS_GROUP_NAMESPACE = ['Layouts','Recess'];
var TOWERVIEW_GROUP_NAMESPACE = ['Layouts','Towerview'];

exports.bindPath = function (app) {
    return function() {
        app.get('/frontpage', site.checkAdmin,
                function(req, res) {
                    function renderPage(docs) {
                        var stories = docs;
                        api.group.docs(FRONTPAGE_GROUP_NAMESPACE, null,
                                function(err, model) {
                                    res.render('admin/layout/frontpage', {
                                        layout: "layout-admin.jade",
                                        locals: {
                                            stories: stories,
                                            model: model
                                        }
                                    });
                                });
                    }
                    // TODO make requests concurrent
                    var filter = req.param("section", null);
                    if (filter) {
                        api.taxonomy.docs(filter, 100,
                                function(err, docs) {
                                    if (err) globalFunctions.showError(res, err);
                                    else {
                                        docs = docs.map(function(doc) {
                                            return doc;
                                        });
                                        renderPage(docs);
                                    }
                                });
                    } else {
                        api.docsByDate(100,
                                function(err, docs) {
                                    if (err) globalFunctions.showError(res, err);
                                    renderPage(docs);
                                });
                    }
                }
        );


            app.get('/news', site.checkAdmin,
                function(req, res) {
                    function renderPage(docs) {
                        var stories = docs;
                        api.group.docs(NEWS_GROUP_NAMESPACE, null,
                        function(err, model) {
                            res.render('admin/layout/news', {
                                layout: "layout-admin.jade",
                                locals: {
                                    stories: stories,
                                    model: model
                                }
                            });
                        });
                    }
                    // TODO make requests concurrent
                    // sidebar filter by section
                    var filter = req.param("section", null);
                    if (filter) {
                        api.taxonomy.docs(filter, 100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            else {
                                docs = docs.map(function(doc) {
                                    return doc;
                                });
                                renderPage(docs);
                            }
                        });
                    } else {
                        api.docsByDate(100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            renderPage(docs);
                        });
                    }
                }
            );

            app.get('/sports', site.checkAdmin,
                function(req, res) {
                    function renderPage(docs) {
                        var stories = docs;
                        api.group.docs(SPORTS_GROUP_NAMESPACE, null,
                        function(err, model) {
                            res.render('admin/layout/sports', {
                                layout: "layout-admin.jade",
                                locals: {
                                    stories: stories,
                                    model: model
                                }
                            });
                        });
                    }
                    // TODO make requests concurrent
                    // sidebar filter by section
                    var filter = req.param("section", null);
                    if (filter) {
                        api.taxonomy.docs(filter, 100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            else {
                                docs = docs.map(function(doc) {
                                    return doc;
                                });
                                renderPage(docs);
                            }
                        });
                    } else {
                        api.docsByDate(100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            renderPage(docs);
                        });
                    }
                }
            );

            app.get('/opinion', site.checkAdmin,
                function(req, res) {
                    function renderPage(docs) {
                        var stories = docs;
                        api.group.docs(OPINION_GROUP_NAMESPACE, null,
                        function(err, model) {
                            res.render('admin/layout/opinion', {
                                layout: "layout-admin.jade",
                                locals: {
                                    stories: stories,
                                    model: model
                                }
                            });
                        });
                    }
                    // TODO make requests concurrent
                    // sidebar filter by section
                    var filter = req.param("section", null);
                    if (filter) {
                        api.taxonomy.docs(filter, 100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            else {
                                docs = docs.map(function(doc) {
                                    return doc;
                                });
                                renderPage(docs);
                            }
                        });
                    } else {
                        api.docsByDate(100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            renderPage(docs);
                        });
                    }
                }
            );

            app.get('/recess', site.checkAdmin,
                function(req, res) {
                    function renderPage(docs) {
                        var stories = docs;
                        api.group.docs(RECESS_GROUP_NAMESPACE, null,
                        function(err, model) {
                            res.render('admin/recess', {
                                layout: "layout-admin.jade",
                                locals: {
                                    stories: stories,
                                    model: model
                                }
                            });
                        });
                    }
                    // TODO make requests concurrent
                    // sidebar filter by section
                    var filter = req.param("section", null);
                    if (filter) {
                        api.taxonomy.docs(filter, 100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            else {
                                docs = docs.map(function(doc) {
                                    return doc;
                                });
                                renderPage(docs);
                            }
                        });
                    } else {
                        api.docsByDate(100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            renderPage(docs);
                        });
                    }
                }
            );

            app.get('/towerview', site.checkAdmin,
                function(req, res) {
                    function renderPage(docs) {
                        var stories = docs;
                        api.group.docs(TOWERVIEW_GROUP_NAMESPACE, null,
                        function(err, model) {
                            res.render('admin/layout/towerview', {
                                layout: "layout-admin.jade",
                                locals: {
                                    stories: stories,
                                    model: model
                                }
                            });
                        });
                    }
                    // TODO make requests concurrent
                    // sidebar filter by section
                    var filter = req.param("section", null);
                    if (filter) {
                        api.taxonomy.docs(filter, 100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            else {
                                docs = docs.map(function(doc) {
                                    return doc;
                                });
                                renderPage(docs);
                            }
                        });
                    } else {
                        api.docsByDate(100,
                        function(err, docs) {
                            if (err) globalFunctions.showError(res, err);
                            renderPage(docs);
                        });
                    }
                }
            );

            app.post('/frontpage', site.checkAdmin,
            function(req, res) {
                res.render('/');
            });
    }
}