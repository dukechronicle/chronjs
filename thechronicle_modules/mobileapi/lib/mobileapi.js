var api = require('../../api/lib/api');
var taxonomyGroups = ["News","University","Sports"];

exports.init = function(app) {
	app.namespace('/mobile', function() {
		
		app.get('/:groupname', function(req, http_res) {
            var groupName = req.params.groupname;
            //console.log("server.js/mobile" + groupName);
            getGroup(groupName,10,function(err,res){
                console.log("site.js " + res);
                for(doc in res)
                {
                    console.log(res[doc].value.title);
                }
                http_res.send(res);
            });
        });
	});
	
	return app;
}

function grabArticles(groupName, baseDocNum, n,callback){
    api.taxonomy.docs(groupName,n,function(err,test){
        callback(err,test);
    });
}

function getUniversity(n,callback){
    grabArticles(["University"],0,n,callback);
}

function getNews(n,callback){
    grabArticles(["News"],0,n,callback);
}

function getSports(n,callback){
    grabArticles(["Sports"],0,n,callback);
}

function capitalizeName(str) {
    return str.toLowerCase().replace(/\b[a-z]/g, upper);
    function upper() {
        return arguments[0].toUpperCase();
    }
}

function contains(obj, array)
{
    for(i in array)
    {
        if(array[i] == obj)
            return true;
    }
    return false;
}


function getGroup(groupName,n,callback)
{
    console.log(groupName);
    groupName = capitalizeName(groupName);
    if(contains(groupName,taxonomyGroups))
    {
        grabArticles([groupName],0,n,callback);
    }
}
