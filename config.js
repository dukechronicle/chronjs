var configuration = {
    "profiles": {
        "production": {
            "SERVER_PORT":"4000",
            "ADMIN_USERNAME":"dean",
            "ADMIN_PASSWORD":"dean",
            "COUCHDB_URL":"http://chrondev:pikachu@chrondev.iriscouch.com",
            "COUCHDB_DATABASE":"chronicle_dev",
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