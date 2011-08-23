var api = require('../../api/lib/api');
var taxonomyGroups = ["News","Sports","Opinion","Recess","Towerview"];
var _ = require('underscore');

exports.init = function(app, callback) {
	app.namespace('/mobile', function() {
		app.get('/:groupname', function(req, http_res) {
            var groupName = req.params.groupname;
            //console.log("server.js/mobile" + groupName);
            getGroup(groupName,10,function(err,res){
                if(res == null)
                {
                     console.log("mobileapi: res is null");
                     http_res.send(err,res);
                }
                var result = [];
                result = _.map(res,function(doc){
                    return {"title": doc.value.title, "teaser": doc.value.teaser, "urls": doc.value.urls};
                });
                http_res.send(result);
            });
        });

        app.get('/article/:articleURL', function(req, http_res) {
            var articleURL = req.params.articleURL;
            api.docForUrl(articleURL, function(err,res){
                //console.log(res);
                http_res.send(res);
            });
        });
	});

    callback();
}

function grabArticles(groupName, baseDocNum, n,callback){
    api.taxonomy.docs(groupName[0],n,function(err,test){
        if(err)
            return callback(err,null);
        
        return callback(err,test);
    });
}

function capitalizeName(str) {
    return str.toLowerCase().replace(/\b[a-z]/g, upper);
    function upper() {
        return arguments[0].toUpperCase();
    }
}

function contains(obj, array){
    for(i in array){
        if(array[i] == obj)
            return true;
    }
    return false;
}


function getGroup(groupName,n,callback){
    console.log(groupName);
    if(contains(groupName,taxonomyGroups)){
        grabArticles([groupName],0,n,callback);
    }
    else{
        return callback("error", "noob");
    }
}
