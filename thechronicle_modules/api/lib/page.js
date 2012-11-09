var api = require("../../api");
var db = require("../../db-abstract");
var log = require("../../log");

var async = require('async');
var dateFormat = require('dateformat');
var JSV = require('JSV').JSV;
var md = require('discount');
var _ = require('underscore');


exports.templates = {
    'Single Block': {
        view: 'site/pages/single-block',
        model: {
            contents: {
                extends: {'$ref': 'markdown'},
                required: true,
                label: 'Body Contents',
            }
        }
    },
    'Simple Slideshow': {
        view: 'site/pages/simple-slideshow',
        model: {
            slideshow: {
                type: 'array',
                label: 'Slideshow Articles',
                required: true,
                items: {'$ref': 'article'},
            },
            list_title: {type: 'string'},
            list: {
                type: 'array',
                label: 'Top List Articles',
                required: true,
                items: {'$ref': 'article'},
            },
            articles: {
                type: 'array',
                label: 'Bottom Block Articles',
                required: true,
                items: {'$ref': 'article'},
            },
        }
    },
    'Orientation': {
        view: 'site/pages/orientation',
        model: {
            schedule: {
                type: 'object',
                label: 'Week Schedule',
                required: true,
                additionalProperties: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            time: {
                                type: 'string',
                                required: true,
                            },
                            title: {
                                type: 'string',
                                required: true,
                            },
                            location: {
                                type: 'string',
                                required: false,
                            }
                        }
                    }
                }
            },
            articles: {
                type: 'array',
                label: 'Orientation Articles',
                required: true,
                items: {'$ref': 'article'},
            },
            recruitment: {
                extends: {'$ref': 'article'},
                label: 'Recruitment Article',
                required: true,
            }
        }
    },
    'Commencement': {
        view: 'site/pages/commencement',
        model: {
            lookbacks: {
                type: 'object',
                label: 'Lookback Articles',
                required: true,
                additionalProperties: {'$ref': 'article'},
            },
            schedule: {
                type: 'array',
                label: 'Weekend Schedule',
                required: true,
                items: {
                    type: 'object',
                    properties: {
                        date: {
                            type: 'string',
                            required: true,
                        },
                        events: {
                            type: 'array',
                            required: true,
                            items: {type: 'string'},
                        },
                    }
                }
            },
            articles: {
                type: 'array',
                label: 'Speaker Articles',
                required: true,
                items: {'$ref': 'article'},
            }
        }
    },
    'Sports Event': {
        view: 'site/pages/sports-event',
        model: {
            information: {
                type: 'object',
                required: true,
                label: 'Game Information',
                properties: {
                    sport: {
                        type: 'string',
                        required: true,
                    },
                    homeGame: {
                        type: 'boolean',
                        required: true,
                    },
                    mainTeam: {
                        type: 'object',
                        required: true,
                        properties: {
                            name: {
                                type: 'string',
                                required: true,
                            },
                            mascot: {
                                type: 'string',
                                required: true,
                            },
                            logo: {
                                type: 'string',
                                required: true,
                            }
                        }
                    },
                    opposingTeam: {
                        type: 'object',
                        required: true,
                        properties: {
                            name: {
                                type: 'string',
                                required: true,
                            },
                            mascot: {
                                type: 'string',
                                required: true,
                            },
                            logo: {
                                type: 'string',
                                required: true,
                            }
                        }
                    },
                    date: {
                        type: 'string',
                        required: true,
                        format: 'date',
                    },
                    location: {
                        type: 'string',
                        required: true,
                    },
                    channel: {
                        type: 'string',
                        required: true,
                    },
                    scoreSelector: {
                        type: 'string',
                    }
                },
                transformation: function (callback) {
                    date = Date.parse(this.date);
                    if (isNaN(date)) {
                        return callback('Invalid date');
                    }
                    this.displayDate = dateFormat(date, 'dddd, mmmm d, yyyy');
                    this.displayTime = dateFormat(date, 'h:MM Z');
                    callback(null, this);
                }
            },
            featured: {
                type: 'array',
                label: 'Featured Articles',
                required: true,
                minItems: 3,
                maxItems: 3,
                items: {'$ref': 'article'},
            },
            articles: {
                type: 'array',
                label: 'Event Articles',
                required: true,
                items: {'$ref': 'article'},
            },
            embed: {
                type: 'string',
                required: true,
                label: 'Featured Embed Code',
            }
        }
    },
    'Election': {
        view: 'site/pages/election',
        model: {
            articles: {
                type: 'array',
                label: 'Articles',
                required: true,
                items: {'$ref': 'article'},
            },
            text: {
                extends: {'$ref': 'markdown'},
                required: true,
                label: 'Featured Text',
            },
            image: {
                type: 'string',
                label: 'Featured Image URL',
                required: true,
            }
        }
    }
};

var schemata = [
    {
        id: 'article',
        extends: {type: 'string'},
        description: 'Article Relative URL',
        transformation: function (callback) {
            api.article.getByUrl(this.toString(), function (err, article) {
                if (err) callback(err);
                else callback(null, api.site.modifyArticleForDisplay(article));
            });
        }
    },
    {
        id: 'markdown',
        extends: {type: 'string'},
        description: 'Markdown text',
        transformation: function (callback) {
            callback(null, md.parse(this.toString()));
        }
    }
];

var validator = JSV.createEnvironment();
_.each(schemata, function (schema) {
    validator.createSchema(schema);
});


exports.getByUrl = function (url, callback) {
    db.page.getByUrl(url, function (err, res) {
        if (err) callback(err);
        else if (res.length == 0) callback();
        else if (res.length == 1) callback(null, res[0].value);
        else callback('Multiple pages found with url: ' + url, res);
    });
};

exports.listByUrl = function (callback) {
    db.page.listByUrl(function (err, res) {
        if (err) return callback(err);
        callback(null, _.map(res, function (doc) {
            return doc.value;
        }));
    });
};

exports.generateModel = function (page, callback) {
    var schema = {
        type: 'object',
        required: true,
        properties: exports.templates[page.template].model,
    };
    var report = validator.validate(page.model, schema);
    if (report.errors.length > 0) {
        return callback(report.errors);
    }

    var operations = convertProperties(report.instance, report.validated);
    async.parallel(operations, function (err) {
        callback(err, page.model);
    });
};

function convertProperties(instance, validated) {
    var operations = [];
    _.each(instance.getProperties(), function (child, key) {
        _.each(validated[child.getURI()], function (schemaUri) {
            var schema = validator.findSchema(schemaUri);
            var operation = schema.getAttribute('transformation');
            if (operation) {
                operations.push(function (callback) {
                    var value = instance.getValue();
                    operation.call(value[key], function (err, result) {
                        value[key] = result;
                        callback(err);
                    });
                });
            }
        });

        var childOperations = convertProperties(child, validated);
        Array.prototype.push.apply(operations, childOperations);
    });
    return operations;
}

exports.view = function (page) {
    return exports.templates[page.template].view;
};

exports.add = function (data, callback) {
    if (!data.url) callback("URL for page required");
    data.type = "page";
    db.page.add(data, callback);
};

exports.edit = function (id, data, callback) {
    db.page.edit(id, data, callback);
};
