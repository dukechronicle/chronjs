exports.showError = function (res, message) {
    res.render('error', {
        locals: {
            message: message
        }
    });
};

exports.log = function (message){
    console.log(message);
};

exports.randomString = function (length) {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var randomstring = '';
    for (var i=0; i< length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
};

exports.trim = function (string) {
    return string.replace(/^\s*|\s*$/g, '')
};

exports.sendJSONResponse = function(res,jsonObject) {
    var jsonString = JSON.stringify(jsonObject);
    
    res.render('json', {
            locals: {
                  json: jsonString
               },
        layout: false
        });
};

exports.capitalizeWords = function(str) {
	return str.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
}

exports.convertObjectToArray = function(obj) {
    var array = [];

    for(var key in Object.keys(obj)) {
        if(typeof obj[key] != "function" && typeof obj[key] != "undefined") {
            array.push(obj[key]);
        }
    }
    
    return array;
};
