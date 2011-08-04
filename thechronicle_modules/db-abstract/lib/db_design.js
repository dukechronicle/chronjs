exports.createViews = function(db) {
	var views = {
	    taxonomy: {
		map: function(doc) {
		    if (doc.taxonomy) {
			    for (var i in doc.taxonomy) {
		            emit([doc.taxonomy[i], doc.created], doc);
			    }
		    }
		}
	    },
	    // return all doc ids keyed by doc url if one exists
	    urls: {
		map: function(doc) {
		    if(doc.urls) {
		        for(var i in doc.urls) {
		            emit(doc.urls[i], doc._id);
		        }
		    }
		}
	    },
	    // return all doc ids keyed by document author name if one exists
	    authors: {
		map: function(doc) {
		    if(doc.authors) {
		        for(var i in doc.authors)
		            emit(doc.authors[i], doc._id);
		    }
		}
	    },
	    // get the uuid of all children keyed by fully qualified group name
	    groups: {
		map: function(doc) {
            if(doc.groups) {
                doc.groups.forEach(function(group) {
                    emit(group, {title: doc.title});
                });
            }
		},
        reduce: function(keys, values, rereduce) {
          if (rereduce) {
            return sum(values);
          } else {
            return values.length;
          }
        }
	    },
	    // return articles keyed by date
	    all_by_date: {
		map: function(doc) {
		    if(doc.urls) {
		        emit(doc.created, doc);
		    }
		}
	    },
	    image_originals: {
		map: function(doc) {
		    if(doc.imageVersions) {
		        emit(doc.name, doc);
		    }
		}
	    },
	    photographers: {
		map: function(doc) {
		    if(doc.photographer) {
		        emit(doc.photographer, doc);
		    }
		}
	    },
	    image_versions: {
	        map: function(doc) {
	            if(doc.original) {
	                emit(doc.original, doc);
	            }
	        }
	    }
	};

	db.save('_design/articles', views);
}
