var configuration = {
	profiles: {
		development: {
			COUCHDB_URL: 'http://chrondev:pikachu@chrondev.iriscouch.com',
			COUCHDB_DATABASE: 'chronicle_dev',
			S3_BUCKET: 'chron_bucket1',
			S3_KEY: 'AKIAIV2G6LCBMGKP35DQ',
			S3_SECRET: '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',
			REDIS_URL: 'redis://redistogo:0235bf0a2db5e6cc087683952f60c59c@icefish.redistogo.com:9249/',
			SOLR_HOST: 'index.websolr.com',
			SOLR_PORT: '80',
			SOLR_CORE: '/c1af51aeb37',
			SOLR_PATH: '/solr',
		},
		production: {
			COUCHDB_URL: 'http://chrondev:pikachu@chrondev.iriscouch.com',
			COUCHDB_DATABASE: 'production',
			S3_BUCKET: 'chron_bucket1',
			S3_KEY: 'AKIAIV2G6LCBMGKP35DQ',
			S3_SECRET: '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',
			REDIS_URL: 'redis://redistogo:0235bf0a2db5e6cc087683952f60c59c@icefish.redistogo.com:9249/',
			SOLR_HOST: 'index.websolr.com',
			SOLR_PORT: '80',
			SOLR_CORE: '/c1af51aeb37',
			SOLR_PATH: '/solr',
		}
	},
	activeConfigurationProfile: 'development'
};

exports.getConfiguration = function()
{
	return configuration;
}
