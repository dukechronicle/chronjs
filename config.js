var configuration = {
    "profiles": {
        "production": {
            "SERVER_PORT":"4000",
            "ADMIN_USERNAME":"dean",
            "ADMIN_PASSWORD":"dean",
            "COUCHDB_URL":"https://chrondev:pikachu@chrondev.iriscouch.com",
            "COUCHDB_DATABASE":"production",

            //"COUCHDB_URL":"https://app578498.heroku:NNbL2x3Bu5vGLgComPjWxxET@app578498.heroku.cloudant.com",
            //"COUCHDB_DATABASE":"production",

            "S3_BUCKET":"chron_bucket1",
            "REDIS_URL":"redis://redistogo:0235bf0a2db5e6cc087683952f60c59c@icefish.redistogo.com:9249/",
            "SOLR_HOST":"index.websolr.com",
            "SOLR_PORT":"80",
            "SOLR_CORE":"/c1af51aeb37",
            "SOLR_PATH":"/solr",
            "S3_KEY":"AKIAJIH3MOVTAMXCFKXA",
            "S3_SECRET":"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"
        }
    },
    "activeConfigurationProfile":"production"
};

exports.getConfiguration = function() {
    try {
        return configuration;
    } catch(err) {
        return null;
    }
}
