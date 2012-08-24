var api = require("../../api");
var db = require("../../db-abstract");
var log = require("../../log");

var JSV = require('JSV').JSV;
var md = require('discount');
var _ = require('underscore');


var validator = JSV.createEnvironment();
validator.createSchema({
    id: 'markdown',
    extends: {type: 'string'},
    description: 'Markdown text',
});

var GROUP_TYPES = {
    'markdown': md.parse,
};

exports.schemata = {
    'Single Block': {
        view: 'site/pages/single-block',
        model: {
            contents: {
                extends: {'$ref': 'markdown'},
                required: true,
                name: 'Body Contents',
            }
        }
    },
    'Orientation': {
        view: 'site/pages/orientation-2012',
        model: {
            schedule: {
                type: 'object',
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
                required: true,
                items: {type: 'string'},
            },
            recruitment: {
                type: 'string',
                required: true,
            }
        }
    }
};

exports.getByUrl = function (url, callback) {
    db.page.getByUrl(url, function (err, res) {
        if (err) callback(err);
        else if (res.length == 0) callback();
        else if (res.length == 1) callback(null, res[0].value);
        else callback('Multiple pages found with url: ' + url, res);
    });
};

exports.generateModel = function (page) {
    var schema = {
        type: 'object',
        required: true,
        properties: exports.schemata[page.template].model,
    };
    var report = validator.validate(page.model, schema);
    if (report.errors.length > 0) {
        log.error(report.errors);
        return null;
    }

    recurseInstances(report.instance, report.validated);
    return page.model;
};

function recurseInstances(instance, validated) {
    _.each(instance.getProperties(), function (child, key) {
        _.each(validated[child.getURI()], function (schemaUri) {
            var type = validator.findSchema(schemaUri).getAttribute('id');
            if (type in GROUP_TYPES) {
                instance.getValue()[key] = GROUP_TYPES[type](instance.getValue()[key]);
            }
        });

        recurseInstances(child, validated);
    });
}

exports.view = function (page) {
    return exports.schemata[page.template].view;
};

exports.add = function (data, callback) {
    if (!data.url) callback("URL for page required");

    data.type = "page";

    db.page.add(data, function (err, res) {
        if (err) callback(err);
        else callback(null, data.node_title);
    });
};

exports.edit = function (id, data, callback) {
    db.page.edit(id, data, function (err, res) {
        if (err) callback(err);
        else callback(null, data.node_title);
    });
};
