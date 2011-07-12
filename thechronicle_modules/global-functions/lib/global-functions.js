exports.showError = function (res, message) {
    res.render('error', {
        locals: {
            message: message
        }
    });
}

exports.log = function (message){
	console.log(message);
}

exports.randomString = function (length) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = length;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

exports.sendJSONResponse = function(res,json_object) {
	var json_string = JSON.stringify(json_object);
	
	res.render('json', {
        	locals: {
       		   json: json_string
       		},
		layout: false
    	});
}
