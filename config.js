var configuration = {
	profiles: {
		development: {
			COUCHDB_URL: 'http://chrondev:pikachu@chrondev.iriscouch.com',
			COUCHDB_DATABASE: 'chronicle_dev',
			S3_BUCKET: 'chron_bucket1',
			S3_KEY: 'AKIAIV2G6LCBMGKP35DQ',
			S3_SECRET: '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',
			REDIS_URL: 'redis://redistogo:0235bf0a2db5e6cc087683952f60c59c@icefish.redistogo.com:9249/',
		},
		production: {
			COUCHDB_URL: 'http://chrondev:pikachu@chrondev.iriscouch.com',
			COUCHDB_DATABASE: 'production',
			S3_BUCKET: 'chron_bucket1',
			S3_KEY: 'AKIAIV2G6LCBMGKP35DQ',
			S3_SECRET: '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',
			REDIS_URL: 'redis://redistogo:0235bf0a2db5e6cc087683952f60c59c@icefish.redistogo.com:9249/',
		}
	},
	activeConfigurationProfile: 'development'
};

exports.getConfiguration = function()
{
	return configuration;
}
