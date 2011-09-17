var api = require('../../api/lib/api');
var taxonomyGroups = ["News","Sports","Opinion","Recess","Towerview"];
var _ = require('underscore');

exports.init = function(app, callback) {
    app.namespace('/mobile-api', function() {
        app.get('/:groupname', function(req, http_res) {
            var groupName = req.params.groupname;
            //console.log("server.js/mobile" + groupName);
            getGroup(groupName,10,function(err,res){
                if (err) http_res.send(err);
                if(res == null)
                {
                     console.log("mobileapi: res is null");
                     http_res.send(err,res);
                }
                var result = [];
                result = _.map(res,function(doc){
                    return {"title": doc.value.title, "teaser": doc.value.teaser, "urls": doc.value.urls};
                });
                if(req.query.callback == null) {
                    http_res.send(result);
                } else {
                    http_res.send(req.query.callback + "(" + JSON.stringify(result) + ")");
                }
            });
        });

        app.get('/article/:articleURL', function(req, http_res) {
            var articleURL = req.params.articleURL;
            api.docForUrl(articleURL, function(err,res){
                //console.log(res);
                if(req.query.callback == null) {
                    http_res.send(res);
                } else {
                    http_res.send(req.query.callback + "(" + JSON.stringify(res) + ")");
                }
            });
        });
    });

    callback(null);
}

function grabArticles(groupName, baseDocNum, n,callback){
    api.taxonomy.docs(groupName[0],n,function(err,docs){
        if(err)
            return callback(err,null);
        
        return callback(err,docs);
    });
}

function capitalizeName(str) {
    return str.toLowerCase().replace(/\b[a-z]/g, upper);
    function upper() {
        return arguments[0].toUpperCase();
    }
}

function getGroup(groupName,n,callback){
    console.log(groupName);
    if(taxonomyGroups.indexOf(groupName) !== -1){
        grabArticles([groupName],0,n,callback);
    }
    else{
        return callback("Invalid Group", null);
    }
}
