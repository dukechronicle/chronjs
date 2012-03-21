var api = require('../../api');
var config = require('../../config');
var globalFunctions = require('../../global-functions');

var _ = require("underscore");
var async = require("async");


exports.renderLayout = function (req, res, next) {
    var section = req.query.section;
    var group = globalFunctions.capitalizeWords(req.params.group);
    var layoutConfig = api.group.getLayoutGroups();
    
    async.parallel({
        sectionDocs: function (cb) {
            if (section)
                api.taxonomy.docs([section], 30, null, cb);
            else
                api.docsByDate(30, null, cb);
        },
        groupDocs: function (cb) {
            api.group.docs(layoutConfig[group].namespace, null, cb);
        }
    }, function (err, results) {
        if (err) next(err);
        else {
            // sort section documents alphabetically
            results.sectionDocs = _.sortBy(results.sectionDocs, function (doc) {
                return doc.title;
            });
            
            res.render("admin/page-layout", {
                css:['admin/layout'],
                js:['admin/layout?v=1'],
                locals:{
                    page: group,
                    groups: layoutConfig[group].groups,
                    mainSections: config.get("TAXONOMY_MAIN_SECTIONS"),
                    sectionDocs: results.sectionDocs,
                    groupDocs: results.groupDocs,
                    nameSpace: layoutConfig[group].namespace
                }
            });      
        }
    });
};
