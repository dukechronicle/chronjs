var api = require('../../api');
var globalFunctions = require('../../global-functions');
var async = require('async');

exports.init = function(app) {
	app.namespace('/admin', function() {
		app.get('/addgroup', function(req, http_res) {
		    api.group.create(req.query.addgroup, function(err, res) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            http_res.redirect('/admin/add');
		        }
		    })
		});
		
		app.get('/add', function(req, http_res) {
		    api.group.list(['section'], function(err, groups) {
		        http_res.render('admin/add', {
		            locals: {groups: groups}
		        });
		    });
		});
		
		app.get('/manage', function(req, http_res) {
		    api.docsByDate(function(err, res) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            http_res.render('admin/manage', {
		                locals: {docs: res}
		            });
		        }
		    });
		});
		
		app.post('/edit', function(req, http_res) {
		    var id = req.body.doc.id;
		    var new_groups = req.body.doc.groups;
		    if(!(new_groups instanceof Array)) { //we will get a string if only one box is checked
		        new_groups = [new_groups];
		    }
		    var fields = {
		        title: req.body.doc.title,
		        body: req.body.doc.body,
		        groups: new_groups
		    };
		    api.editDoc(id, fields, function(err, res) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            http_res.redirect('/article/' + res.merge[1] + '/edit');
		        }
		    });
		});
		
		app.post('/add', function(req, http_res) {
		    var fields = {body: req.body.doc.body};
		    api.addDoc(fields, req.body.doc.title, function(err, res, url) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            var groups = req.body.doc.groups;
		            if(groups) {
		                var fcns = [];
		                if(!(groups instanceof Array)) { //we will get a string if only one box is checked
		                    groups = [groups];
		                }
		                async.map(groups, function(group) {
		                	return ['section'].concat(group);
		                }, function(err, groups) {
		                	api.group.add(res.id, groups, function(add_err, add_res) {
			                    if(add_err) {
			                        globalFunctions.showError(http_res, add_err);
			                    } else {
			                        http_res.redirect('article/' + url);
			                    }
			                });
		                })
		                
		                
		            } else {
		                http_res.redirect('article/' + url);
		            }
		        }
		    });
		});
	});
	
	return app;
}
