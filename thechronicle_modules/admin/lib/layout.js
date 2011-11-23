var site = require('../../api/lib/site.js');
var api = require('../../api');
var _ = require("underscore");

var LAYOUT_CONFIG = {
    "frontpage": {
        "namespace": ['Layouts','Frontpage'],
        "layout": "admin/layout/frontpage"
    },
    "news": {
        "namespace": ['Layouts','News'],
        "layout": "admin/layout/news"
    },
    "sports": {
        "namespace": ['Layouts','Sports'],
        "layout": "admin/layout/sports"
    },
    "opinion": {
        "namespace": ['Layouts','Opinion'],
        "layout": "admin/layout/opinion"
    },
    "recess": {
        "namespace": ['Layouts','Recess'],
        "layout": "admin/layout/recess"
    },
    "towerview": {
        "namespace": ['Layouts','Towerview'],
        "layout": "admin/layout/towerview"
    }
}

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
            renderPage(req,res,docs);
        });
    }
};

function renderPage(req,res,section_docs) {
    var stories = _.sortBy(section_docs, function (doc) {
        return doc.title;
    }); // sort section docs alphabetically
    
    // get and show the current groupings
    api.group.docs(LAYOUT_CONFIG[req.params.group].namespace, null, function (err, model) {
        res.render(LAYOUT_CONFIG[req.params.group].layout,
        {
            layout:"layout-admin.jade",
            locals:{
                stories:stories,
                model:model
            }
        });
    });
}
