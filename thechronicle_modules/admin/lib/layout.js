var taxonomy = require('../../api/lib/taxonomy.js');
var groups = require('../../api/lib/group.js');
var api = require('../../api');
var config = require('../../config');

var _ = require("underscore");


exports.renderLayout = function (req,res,next) {
    var section = req.query.section;
    
    if (section) {
        api.taxonomy.docs([section], 30, null,
        function (err, docs) {
            if (err) next(err);
            else {
                docs = docs.map(function (doc) {
                    return doc;
                });
                renderPage(req,res,docs);
            }
        });
    }
    else {
        api.docsByDate(null, null, function (err, docs) {
            if (err) next(err);
            else renderPage(req,res,docs);
        });
    }
};

function renderPage(req,res,section_docs) {
    var group = _capitalize(req.params.group);
    var layoutConfig = groups.getLayoutGroups();

    var section_docs = _.sortBy(section_docs, function (doc) {
        return doc.title;
    }); // sort section docs alphabetically
    
    // get and show the current groupings
    api.group.docs(layoutConfig[group].namespace, null, function (err, group_docs) {
        res.render("admin/page-layout",
        {
            css:['admin/layout/styles'],
            js:['admin/layout'],
            locals:{
                page: group,
                groups: layoutConfig[group].groups,
                mainSections: config.get("TAXONOMY_MAIN_SECTIONS"),
                sectionDocs: section_docs,
                groupDocs: group_docs,
                nameSpace: layoutConfig[group].namespace
            }
        });
    });
}

function _capitalize(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}
