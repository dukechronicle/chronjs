var cradle = require('cradle');

exports.connect = function(database) {
	var cloudantUrlRegEx = new RegExp('(.*?)://(.*?):(.*?)@(.*)')
	var connect_url = process.env.CLOUDANT_URL || process.env.COUCHDB_URL;
	var cloudant_auth = cloudantUrlRegEx.exec(connect_url);
	
	if(!cloudant_auth) throw "No Cloudant URL specified...";
	var port;
	(cloudant_auth[1] === 'https') ? port = 443 : port = 80;
	
	var conn = new(cradle.Connection)(cloudant_auth[1] + '://' + cloudant_auth[4], port, {
		auth: {username: cloudant_auth[2], password: cloudant_auth[3]}
	}); 
	
	var db = conn.database(database);
    db.create();
    return db;	
}
