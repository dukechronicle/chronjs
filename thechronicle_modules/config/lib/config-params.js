var configParams = [    
    {
        name: 'SERVER_PORT',
        description: 'Port to run the chronicle site on',
        default: '4000'
    },
    {
        name: 'ADMIN_USERNAME',
        description: 'New administrator username to login with from now on',
        default: ''
    },
    {
        name: 'ADMIN_PASSWORD',
        description: 'New administrator password to login with from now on',
        default: ''
    },
    {
        name: 'COUCHDB_URL',
        description: 'CouchDB Server URL',
        default: 'http://chrondev:pikachu@chrondev.iriscouch.com'
    },
    {
        name: 'COUCHDB_DATABASE',
        description: 'CouchDB Database Name',
        default: 'chronicle_dev'
    },
    {
        name: 'S3_BUCKET',
        description: 'Amazon S3 Bucket Name',
        default: 'chron_bucket1'
    },
    {
        name: 'S3_KEY',
        description: 'Amazon S3 Key',
        default: ''
    },
    {
        name: 'S3_SECRET',
        description: 'Amazon S3 Secret Key',
        default: ''
    },
    {
        name: 'REDIS_URL',
        description: 'Redis Server URL',
        default: 'redis://redistogo:0235bf0a2db5e6cc087683952f60c59c@icefish.redistogo.com:9249/'
    },
    {
        name: 'SOLR_HOST',
        description: 'WebSolr Server URL',
        default: 'index.websolr.com'
    },
    {
        name: 'SOLR_PORT',
        description: 'WebSolr Server Port',
        default: '80'
    },
    {
        name: 'SOLR_CORE',
        description: 'WebSolr Core',
        default: '/c1af51aeb37'
    },
    {
        name: 'SOLR_PATH',
        description: 'WebSolr Server Path',
        default: '/solr'
    },
];

exports.getParameters = function()
{
    return configParams;
}
