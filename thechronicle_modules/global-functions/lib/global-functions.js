exports.showError = function (res, message) {
    res.render('error', {
        locals: {
            message: message
        }
    });
}