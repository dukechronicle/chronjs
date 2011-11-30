var site = require('../../api/lib/site.js');
var taxonomy = require('../../api/lib/taxonomy.js');
var groups = require('../../api/lib/group.js');
var api = require('../../api');
var _ = require("underscore");

exports.bindPath = function (app) {
    return function() {
        app.get('/group/:group', site.checkAdmin, _getDocsInSection);
    }
};

function _getDocsInSection(req,res) {
    var section = req.query.section;
    
    if (section) {
        api.taxonomy.docs(section, 30,
        function (err, docs) {
            if (err) globalFunctions.showError(res, err);
            else {
                docs = docs.map(function (doc) {
                    return doc;
                });
                renderPage(req,res,docs);
            }
        });
    }
    else {
        api.docsByDate(null, null,
        function (err, docs) {
            if (err) globalFunctions.showError(res, err);
            else renderPage(req,res,docs);
        });
    }
};

function renderPage(req,res,section_docs) {
    var group = _capitalize(req.params.group);
    var config = groups.getLayoutGroups();

    var section_docs = _.sortBy(section_docs, function (doc) {
        return doc.title;
    }); // sort section docs alphabetically
    
    // get and show the current groupings
    api.group.docs(config[group].namespace, null, function (err, group_docs) {
        res.render("admin/layout",
        {
            layout:"layout-admin.jade",
            locals:{
                page: group,
                groups: config[group].groups,
                mainSections: taxonomy.getMainSections(),
                sectionDocs: section_docs,
                groupDocs: group_docs,
                nameSpace: config[group].namespace
            }
        });
    });
}

function _capitalize(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}
