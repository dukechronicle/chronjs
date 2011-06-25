var cradle = require('cradle');

exports.connect = function(database) {
	var cloudantUrlRegEx = new RegExp('(.*?)://(.*?):(.*?)@(.*)')
	var cloudant_auth = cloudantUrlRegEx.exec(process.env.CLOUDANT_URL);
	
	var port;
	(cloudant_auth[1] === 'https') ? port = 443 : port = 80;
	
	var conn = new(cradle.Connection)(cloudant_auth[1] + '://' + cloudant_auth[4], port, {
		auth: {username: cloudant_auth[2], password: cloudant_auth[3]}
	}); 
	
	var db = conn.database(database);
    db.create();
    return db;	
}
