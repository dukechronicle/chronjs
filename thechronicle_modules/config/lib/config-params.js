var configParams = [
    {
        name: 'SERVER_PORT',
        description: 'Port to run the chronicle site on',
        defaultValue: '4000'
    },
    {
        name: 'ADMIN_USERNAME',
        description: 'New administrator username to login with from now on',
        defaultValue: ''
    },
    {
        name: 'ADMIN_PASSWORD',
        description: 'New administrator password to login with from now on',
        defaultValue: ''
    },
    {
        name: 'COUCHDB_URL',
        description: 'CouchDB Server URL',
        defaultValue: 'http://chrondev:pikachu@chrondev.iriscouch.com'
    },
    {
        name: 'COUCHDB_DATABASE',
        description: 'CouchDB Database Name',
        defaultValue: 'dev'
    },
    {
        name: 'S3_BUCKET',
        description: 'Amazon S3 Bucket Name',
        defaultValue: 'chron_dev'
    },
    {
        name: 'S3_KEY',
        description: 'Amazon S3 Key',
        defaultValue: ''
    },
    {
        name: 'S3_SECRET',
        description: 'Amazon S3 Secret Key',
        defaultValue: ''
    },
    {
        name: 'REDIS_URL',
        description: 'Redis Server URL',
        defaultValue: ''
    },
    {
        name: 'SOLR_HOST',
        description: 'WebSolr Server URL',
        defaultValue: 'index.websolr.com'
    },
    {
        name: 'SOLR_PORT',
        description: 'WebSolr Server Port',
        defaultValue: '80'
    },
    {
        name: 'SOLR_CORE',
        description: 'WebSolr Core',
        defaultValue: ''
    },
    {
        name: 'SOLR_PATH',
        description: 'WebSolr Server Path',
        defaultValue: '/solr'
    },
    {
        name: 'TAXONOMY_MAIN_SECTIONS',
        description: 'Main sections of the taxonomy',
        defaultValue: {}
    },
    {
        name: 'TAXONOMY',
        description: 'Taxonomy tree for the site, used for categorizing articles and navigation',
        defaultValue: {}
    },
    {
        name: 'LAYOUT_GROUPS',
        description: 'Groups used for layouts',
        defaultValue: {}
    },
    {
        name: 'RSS_FEEDS',
        description: 'RSS feeds to check and store',
        defaultValue: {}
    },
    {
        name: 'MAILCHIMP_API_KEY',
        description: 'MailChimp API key',
        defaultValue: ''
    },
    {
        name: 'MAILCHIMP_LIST_ID',
        description: 'MailChimp List ID',
        defaultValue: ''
    },
    {
        name: 'MAILCHIMP_TEMPLATE_ID',
        description: 'MailChimp Template ID',
        defaultValue: ''
    }
];

exports.getParameters = function() {
    return configParams;
};
