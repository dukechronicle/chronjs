var configuration = {
    "profiles": {
        "dev": {
            
            "COUCHDB_URL":"https://chrondev:pikachu@chrondev.iriscouch.com",
            "COUCHDB_DATABASE":"dev",

            "SERVER_PORT":"4000",

            "ADMIN_USERNAME":"dean",
            "ADMIN_PASSWORD":"dean",

            "REDIS_URL":"redis://jodoglevy:2b258cbdcbbce003452a0ff4279d8701@barreleye.redistogo.com:9148/",

            "SOLR_HOST":"index.websolr.com",
            "SOLR_PORT":"80",
            "SOLR_PATH":"/solr",
            "SOLR_CORE":"/3f534ff3ff0",

            "S3_KEY":"AKIAJIH3MOVTAMXCFKXA",
            "S3_SECRET":"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",
            "S3_BUCKET":"chron_dev",

            "TAXONOMY_MAIN_SECTIONS":["News","Sports", "Opinion", "Recess", "Towerview"],
            "TAXONOMY_BAD_SECTIONS":[
                'News/Graduation Issue',
                'Sports/Tennis','Sports/Basketball',
                'Sports/Soccer','Sports/Golf',
                'Sports/Lacross', 'Sports/Sports Briefs',
                'Sports/Olympics', 'Sports/Sports Features',
                'Sports/Sports Column', 'Sports/Department of Athletics',
                'Sports/Durham Bulls', 'Sports/Wrestling',
                'Sports/Volleyball', 'Sports/Fencing',
                'Sports/Field Hockey',
                'Opinion/Cartoons', 'Towerview/Blue Devil Crossing',
                'Towerview/Bus Stop',
                'Towerview/Blue Devil Crossing',
                'Towerview/Driving Distance',
                'Towerview/Rearview Mirror',
                'Towerview/The Devil\'s Details',
                'Towerview/The Green Light'
            ]
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
