var nimble = require('nimble');

exports.init = function(api, db) {
	var group = {};
	//private function that is shared
	_list_groups = function(options, callback) {
	    db.view('articles/list_groups', options,
	    function(err, res) {
	        callback(err, res);
	    }
	);
	}
	
	group.list = function(callback) {
	    _list_groups({}, function(err, res) {
	        if(err) {
	            callback(err, null);
	        } else {
	            nimble.map(res, function(val, cbck) {
	                cbck(null, val.key);
	            }, callback);
	        }
	    });
	}
	
	group.create = function(group, callback) {
	    //check if group exists
	    _list_groups({
	        startkey: group,
	        endkey: group
	    }, function(err, res) {
	        if(res.length == 0) {
	            //doesn't exist
	            db.save({
	                group_name: group,
	                children: []
	            }, 
	            callback);
	        }
	        else {
	            callback("group already exists", null);
	        }
	    });
	}
	
	function _add_remove_logic(docid, group, callback, dbres, logic) {
	
	    var children = dbres[0].value.children;
	    //add to group document
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
	                var groups = res2.groups;
	                if(!groups) {
	                    groups = [];
	                }
	                logic(groups, group);
	                db.merge(docid, {
	                    groups: groups
	                },
	                acallback);
	            }
	        });
	    }], 
	    callback);
	}
	
	function _add_to_group(docid, group, callback) {
	    console.log(group)
	    //check if group exists
	    _list_groups({
	        key: group
	    },
	    function(err, res) {
	        if(err) {
	            callback(err, null);
	        }
	        else if (res.length == 0) {
	            callback("group does not exist", null);
	        }
	        else {
	            var children = res[0].value.children;
	            if (children.indexOf(docid) != -1) {
	                callback("Document already in this group", null);
	            }
	            else {
	                _add_remove_logic(docid, group, callback, res, function(arr, obj) {
	                    arr.push(obj);
	                });
	            }
	        }
	    });
	}
	
	group.add = function(docid, groups, callback) {
	    nimble.map(groups, function(item, cbck) {
	        cbck(null, function(acallback) {
	            _add_to_group(docid, item, acallback);
	        });
	    }, function(map_err, results) {
	        nimble.series(results, function(ser_err, ser_res) {
	            callback(ser_err, ser_res);
	        });
	    });
	}
	
	function _remove_from_group(docid, group, callback) {
	    //check if group exists
	    _list_groups({
	        startkey: group,
	        endkey: group
	    },
	    function(err, res) {
	        if (res.length == 0) {
	            callback("group does not exist", null);
	        }
	        else {
	            var children = res[0].value.children;
	            if (children.indexOf(docid) == -1) {
	                callback("Document not in this group", null);
	            }
	            else {
	                _add_remove_logic(docid, group, callback, res, function(arr, obj) {
	                    var index = arr.indexOf(obj);
	                    arr.splice(index, 1);
	                });
	            }
	        }
	    });
	}
	
	group.remove = function(docid, groups, callback) {
	    nimble.map(groups, function(item, cbck) {
	        cbck(null, function(acallback) {
	            _remove_from_group(docid, item, acallback);
	        });
	    }, function(map_err, map_res) {
	        nimble.series(map_res, callback);
	    });
	}
	
	function _get_documents_for_group(group, callback) {
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
	
	group.get_documents = function(groups, callback) {
	    var add = function(memo, item, cbk) {
	        memo[item] = function(acallback) {
	            _get_documents_for_group(item, acallback);
	        };
	        cbk(null, memo);
	    };
	    nimble.reduce(groups, add, {}, function(err, res) {
	        nimble.parallel(res, callback);
	    });
	}
	
	function _edit_group(docid, new_groups, callback) {
		console.log(docid);
	    api.get_document_by_id(docid, function(get_err, get_res) {
	        if(get_err) {
	           callback(get_err, null);
	        } else {
	        	// find the difference between original and old groups
	            var orig_groups = get_res.groups;
	            console.log(new_groups)
	            nimble.series([
	                function(acallback) {
	                	if (orig_groups) {
		                    nimble.filter(new_groups, function(val, cbck) {
		                        cbck(null, orig_groups.indexOf(val) == -1);
		                    }, acallback);
		                } else {
							acallback(null, new_groups);
		                }
	                },
	                function(acallback) {
	                	if (orig_groups) {
		                    nimble.filter(orig_groups, function(val, cbck) {
		                        cbck(null, new_groups.indexOf(val) == -1);
		                    }, acallback)
		                } else {
		                	acallback(null, []);
		                }
	                }
	            ], function(err, res) {
	                nimble.series([
	                    function(acallback) {
	                        api.group.add(docid, res[0], acallback);
	                    },
	                    function(acallback) {
	                        api.group.remove(docid, res[1], acallback);
	                    }
	                ], callback);
	            });
	        }
	    });
	}
	return group;
}
