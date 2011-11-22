var configuration = {
    "profiles": {
        "dev": {
            
            "COUCHDB_URL":"https://chrondev:pikachu@chrondev.iriscouch.com",
            "COUCHDB_DATABASE":"dev",

            "SERVER_PORT":"4000",

            "ADMIN_USERNAME":"dean",
            "ADMIN_PASSWORD":"dean",

            "REDIS_URL":"redis://redistogo:0235bf0a2db5e6cc087683952f60c59c@icefish.redistogo.com:9249/",

            "SOLR_HOST":"index.websolr.com",
            "SOLR_PORT":"80",
            "SOLR_PATH":"/solr",
            "SOLR_CORE":"/3f534ff3ff0",

            "S3_KEY":"AKIAJIH3MOVTAMXCFKXA",
            "S3_SECRET":"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",
            "S3_BUCKET":"chron_dev"
        }
    },
    "activeConfigurationProfile":"dev"
};

exports.getConfiguration = function() {
    try {
        return configuration;
    } catch(err) {
        return null;
    }
};
