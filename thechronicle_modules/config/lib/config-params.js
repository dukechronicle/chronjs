var configParams = [
    {
        name: 'ADMIN_USERNAME',
        description: 'New administrator username to login with from now on',
        defaultValue: 'admin'
    },
    {
        name: 'ADMIN_PASSWORD',
        description: 'New administrator password to login with from now on',
        defaultValue: 'chronicle'
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
        defaultValue: 'redis://jodoglevy:2b258cbdcbbce003452a0ff4279d8701@barreleye.redistogo.com:9148/'
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
        defaultValue: '/3f534ff3ff0'
    },
    {
        name: 'SOLR_PATH',
        description: 'WebSolr Server Path',
        defaultValue: '/solr'
    },
    {
        name: 'TAXONOMY_MAIN_SECTIONS',
        description: 'Main sections of the taxonomy',
        defaultValue: [
            "News",
            "Sports",
            "Opinion",
            "Recess",
            "Towerview"
        ]
    },
    {
        name: 'TAXONOMY',
        description: 'Taxonomy tree for the site, used for categorizing articles and navigation',
        defaultValue: [
                {
                    "News": [
                        {
                            "University": [
                                {
                                    "Residence Life": []
                                },
                                {
                                    "Dining": []
                                },
                                {
                                    "DSG": []
                                },
                                {
                                    "Graduate and Professional Schools": []
                                },
                                {
                                    "Student Life": []
                                },
                                {
                                    "Campus Crime": []
                                },
                                {
                                    "Academics": []
                                },
                                {
                                    "Board of Trustees": []
                                }
                            ]
                        },
                        {
                            "Local & National": [
                                {
                                    "City of Durham": []
                                },
                                {
                                    "Higher Education": []
                                },
                                {
                                    "Durham Crime": []
                                },
                                {
                                    "North Carolina": []
                                },
                                {
                                    "National News and Politics": []
                                }
                            ]
                        },
                        {
                            "Health & Science": [
                                {
                                    "Research": []
                                },
                                {
                                    "Pratt": []
                                },
                                {
                                    "DUHS": []
                                },
                                {
                                    "Environment & Sustainability": []
                                },
                                {
                                    "Student Health": []
                                },
                                {
                                    "School of Medicine": []
                                }
                            ]
                        }
                    ]
                },
                {
                    "Sports": [
                        {
                            "Men": [
                                {
                                    "Baseball": []
                                },
                                {
                                    "Basketball": []
                                },
                                {
                                    "Cross country": []
                                },
                                {
                                    "Fencing": []
                                },
                                {
                                    "Football": []
                                },
                                {
                                    "Golf": []
                                },
                                {
                                    "Lacrosse": []
                                },
                                {
                                    "Soccer": []
                                },
                                {
                                    "Swimming and diving": []
                                },
                                {
                                    "Tennis": []
                                },
                                {
                                    "Track and field": []
                                },
                                {
                                    "Wrestling": []
                                }
                            ]
                        },
                        {
                            "Women": [
                                {
                                    "Basketball": []
                                },
                                {
                                    "Cross country": []
                                },
                                {
                                    "Fencing": []
                                },
                                {
                                    "Field hockey": []
                                },
                                {
                                    "Golf": []
                                },
                                {
                                    "Lacrosse": []
                                },
                                {
                                    "Rowing": []
                                },
                                {
                                    "Soccer": []
                                },
                                {
                                    "Swimming and diving": []
                                },
                                {
                                    "Tennis": []
                                },
                                {
                                    "Track and field": []
                                },
                                {
                                    "Volleyball": []
                                }
                            ]
                        }
                    ]
                },
                {
                    "Opinion": []
                },
                {
                    "Recess": [
                        {
                            "Page Two": []
                        },
                        {
                            "Arts": []
                        },
                        {
                            "Music": []
                        },
                        {
                            "Film and Literature": []
                        }
                    ]
                },
                {
                    "Towerview": []
                }
            ]
    },
    {
        name: 'LAYOUT_GROUPS',
        description: 'Groups used for layouts',
        defaultValue: {
                "Frontpage": {
                    "namespace": [
                        "Layouts",
                        "Frontpage"
                    ],
                    "groups": [
                        "Breaking",
                        "Slideshow",
                        "Left Headlines",
                        "Right Headlines",
                        "Opinion",
                        "News",
                        "Sports",
                        "Recess",
                        "Towerview"
                    ]
                },
                "News": {
                    "namespace": [
                        "Layouts",
                        "News"
                    ],
                    "groups": [
                        "Featured",
                        "Right Headlines",
                        "Headlines",
                        "Stories"
                    ]
                },
                "Sports": {
                    "namespace": [
                        "Layouts",
                        "Sports"
                    ],
                    "groups": [
                        "Slideshow",
                        "Stories"
                    ]
                },
                "Opinion": {
                    "namespace": [
                        "Layouts",
                        "Opinion"
                    ],
                    "groups": [
                        "Featured",
                        "Columnists",
                        "Edit Board",
                        "More Columnists"
                    ]
                },
                "Recess": {
                    "namespace": [
                        "Layouts",
                        "Recess"
                    ],
                    "groups": [
                        "Featured",
                        "Sandbox",
                        "Interviews",
                        "Reviews",
                        "Stories"
                    ]
                },
                "Towerview": {
                    "namespace": [
                        "Layouts",
                        "Towerview"
                    ],
                    "groups": [
                        "Featured",
                        "Savvy",
                        "Wisdom",
                        "Editors Note",
                        "Prefix"
                    ]
                }
        }
    },
    {
        name: 'RSS_FEEDS',
        description: 'RSS feeds to check and store',
        defaultValue: [
                {
                    "title": "sportsblog",
                    "url": "http://feeds.feedburner.com/chronicleblogs/sports"
                },
                {
                    "title": "twitter-DukeChronicle",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=DukeChronicle"
                },
                {
                    "title": "twitter-ChronicleRecess",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=ChronicleRecess"
                },
                {
                    "title": "twitter-TowerviewMag",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=TowerviewMag"
                },
                {
                    "title": "twitter-DukeBasketball",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=dukebasketball"
                },
                {
                    "title": "twitter-ChronPhoto",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=ChronPhoto"
                },
                {
                    "title": "twitter-ChronicleSports",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=chroniclesports"
                },
                {
                    "title": "newsblog",
                    "url": "http://feeds.feedburner.com/chronicleblogs/news"
                },
                {
                    "title": "recessblog",
                    "url": "http://feeds.feedburner.com/chronicleblogs/playground"
                },
                {
                    "title": "blog-opinion",
                    "url": "http://feeds.feedburner.com/chronicleblogs/backpages"
                }
            ]
    },
    {
        name: 'MAILCHIMP_API_KEY',
        description: 'MailChimp API key',
        defaultValue: ''
    },
    {
        name: 'MAILCHIMP_LIST_ID',
        description: 'MailChimp List ID',
        defaultValue: '21f5467afc'
    },
    {
        name: 'MAILCHIMP_TEMPLATE_ID',
        description: 'MailChimp Template ID',
        defaultValue: '429'
    }
];

exports.getParameters = function() {
    return configParams;
};
