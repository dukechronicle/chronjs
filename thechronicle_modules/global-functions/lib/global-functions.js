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
