var api = require('../api');
var globalFunctions = require('../global-functions');

exports.init = function(app) {
	app.namespace('/admin', function() {
		app.get('/addbin', function(req, http_res) {
		    api.bin.create(req.query.addbin, function(err, res) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            http_res.redirect('/admin/add');
		        }
		    })
		});
		
		app.get('/add', function(req, http_res) {
		    api.bin.list(function(err, bins) {
		        http_res.render('admin/add', {
		            locals: {bins: bins}
		        });
		    });
		});
		
		app.get('/manage', function(req, http_res) {
		    api.all_docs_by_date(function(err, res) {
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
		    var new_bins = req.body.doc.bins;
		    if(!(new_bins instanceof Array)) { //we will get a string if only one box is checked
		        new_bins = [new_bins];
		    }
		    var fields = {
		        title: req.body.doc.title,
		        body: req.body.doc.body,
		        bins: new_bins
		    };
		    api.edit_document(id, fields, function(err, res) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            http_res.redirect('/article/' + res.merge[1] + '/edit');
		        }
		    });
		});
		
		app.post('/add', function(req, http_res) {
		    var fields = {body: req.body.doc.body};
		    api.add_document(fields, req.body.doc.title, function(err, res, url) {
		        if(err) {
		            globalFunctions.showError(http_res, err);
		        } else {
		            var bins = req.body.doc.bins;
		            if(bins) {
		                var fcns = [];
		                if(!(bins instanceof Array)) { //we will get a string if only one box is checked
		                    bins = [bins];
		                }
		                
		                api.bin.add(res.id, bins, function(add_err, add_res) {
		                    if(add_err) {
		                        globalFunctions.showError(http_res, add_err);
		                    } else {
		                        http_res.redirect('article/' + url);
		                    }
		                });
		            } else {
		                http_res.redirect('article/' + url);
		            }
		        }
		    });
		});
	});
	
	return app;
}
