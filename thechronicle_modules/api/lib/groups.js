var nimble = require('nimble');

exports.init = function(api, db) {
	api.bin = {};
	//private function that is shared
	_list_bins = function(options, callback) {
	    db.view('articles/list_groups', options,
	    function(err, res) {
	        callback(err, res);
	    }
	);
	}
	
	api.bin.list = function(callback) {
	    _list_bins({}, function(err, res) {
	        if(err) {
	            callback(err, null);
	        } else {
	            nimble.map(res, function(val, cbck) {
	                cbck(null, val.key);
	            }, callback);
	        }
	    });
	}
	
	api.bin.create = function(bin, callback) {
	    //check if bin exists
	    _list_bins({
	        startkey: bin,
	        endkey: bin
	    }, function(err, res) {
	        if(res.length == 0) {
	            //doesn't exist
	            db.save({
	                bin_name: bin,
	                children: []
	            }, 
	            callback);
	        }
	        else {
	            callback("Bin already exists", null);
	        }
	    });
	}
	
	function _add_remove_logic(docid, bin, callback, dbres, logic) {
	
	    var children = dbres[0].value.children;
	    //add to bin document
	    logic(children, docid);
	    nimble.series([
	    function(acallback) {
	        db.merge(dbres[0].id, {
	            children: children
	        },
	        acallback);
	    },
	    function(acallback) {
	        api.get_document_by_id(docid,
	        function(err2, res2) {
	            if (err2) {
	                acallback(err2, null);
	            }
	            else {
	                var bins = res2.bins;
	                if(!bins) {
	                    bins = [];
	                }
	                logic(bins, bin);
	                db.merge(docid, {
	                    bins: bins
	                },
	                acallback);
	            }
	        });
	    }], 
	    callback);
	}
	
	function _add_to_bin(docid, bin, callback) {
	    console.log(bin)
	    //check if bin exists
	    _list_bins({
	        key: bin
	    },
	    function(err, res) {
	        if(err) {
	            callback(err, null);
	        }
	        else if (res.length == 0) {
	            callback("Bin does not exist", null);
	        }
	        else {
	            var children = res[0].value.children;
	            if (children.indexOf(docid) != -1) {
	                callback("Document already in this bin", null);
	            }
	            else {
	                _add_remove_logic(docid, bin, callback, res, function(arr, obj) {
	                    arr.push(obj);
	                });
	            }
	        }
	    });
	}
	
	api.bin.add = function(docid, bins, callback) {
	    nimble.map(bins, function(item, cbck) {
	        cbck(null, function(acallback) {
	            _add_to_bin(docid, item, acallback);
	        });
	    }, function(map_err, results) {
	        nimble.series(results, function(ser_err, ser_res) {
	            callback(ser_err, ser_res);
	        });
	    });
	}
	
	function _remove_from_bin(docid, bin, callback) {
	    //check if bin exists
	    _list_bins({
	        startkey: bin,
	        endkey: bin
	    },
	    function(err, res) {
	        if (res.length == 0) {
	            callback("Bin does not exist", null);
	        }
	        else {
	            var children = res[0].value.children;
	            if (children.indexOf(docid) == -1) {
	                callback("Document not in this bin", null);
	            }
	            else {
	                _add_remove_logic(docid, bin, callback, res, function(arr, obj) {
	                    var index = arr.indexOf(obj);
	                    arr.splice(index, 1);
	                });
	            }
	        }
	    });
	}
	
	api.bin.remove = function(docid, bins, callback) {
	    nimble.map(bins, function(item, cbck) {
	        cbck(null, function(acallback) {
	            _remove_from_bin(docid, item, acallback);
	        });
	    }, function(map_err, map_res) {
	        nimble.series(map_res, callback);
	    });
	}
	
	function _get_documents_for_bin(bin, callback) {
	    db.view('articles/group-children', {
	        startkey: ['section'],
	        endkey: ['section', {}]
	    }, 
	    function(err, res) {
	    	if (res) {
		        nimble.map(res, function(item, cbck) {
		            cbck(null, function(acallback) {
		                api.get_document_by_id(item.value, acallback);
		            });
		        }, function(map_err, map_res) {
		            nimble.parallel(map_res, callback);
		        });
		    } else {
		    	callback(null, []);
		    }
	    });
	}
	
	api.bin.get_documents = function(bins, callback) {
	    var add = function(memo, item, cbk) {
	        memo[item] = function(acallback) {
	            _get_documents_for_bin(item, acallback);
	        };
	        cbk(null, memo);
	    };
	    nimble.reduce(bins, add, {}, function(err, res) {
	        nimble.parallel(res, callback);
	    });
	}
	
	function _edit_bin(docid, new_bins, callback) {
		console.log(docid);
	    api.get_document_by_id(docid, function(get_err, get_res) {
	        if(get_err) {
	           callback(get_err, null);
	        } else {
	        	// find the difference between original and old groups
	            var orig_bins = get_res.bins;
	            console.log(new_bins)
	            nimble.series([
	                function(acallback) {
	                	if (orig_bins) {
		                    nimble.filter(new_bins, function(val, cbck) {
		                        cbck(null, orig_bins.indexOf(val) == -1);
		                    }, acallback);
		                } else {
							acallback(null, new_bins);
		                }
	                },
	                function(acallback) {
	                	if (orig_bins) {
		                    nimble.filter(orig_bins, function(val, cbck) {
		                        cbck(null, new_bins.indexOf(val) == -1);
		                    }, acallback)
		                } else {
		                	acallback(null, []);
		                }
	                }
	            ], function(err, res) {
	                nimble.series([
	                    function(acallback) {
	                        api.bin.add(docid, res[0], acallback);
	                    },
	                    function(acallback) {
	                        api.bin.remove(docid, res[1], acallback);
	                    }
	                ], callback);
	            });
	        }
	    });
	}
	return api;
}
