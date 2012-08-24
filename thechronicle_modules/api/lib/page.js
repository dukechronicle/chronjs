var api = require("../../api");
var db = require("../../db-abstract");
var log = require("../../log");

var async = require('async');
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

var schemata = [
    {
        id: 'markdown',
        extends: {type: 'string'},
        description: 'Markdown text',
    }
];
var validator = JSV.createEnvironment();
_.each(schemata, function (schema) {
    validator.createSchema(schema);
});

var TRANSFORMATIONS = {
    'markdown': function (markdown, callback) {
        callback(null, md.parse(markdown));
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
            var type = validator.findSchema(schemaUri).getAttribute('id');
            if (type in TRANSFORMATIONS) {
                operations.push(function (callback) {
                    var value = instance.getValue();
                    var operation = TRANSFORMATIONS[type];
                    operation(value[key], function (err, result) {
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
