var db = require('../../db-abstract');

var taxonomy = exports;

// sections that exists, but that we don't want to show up in the taxonomy
var BAD_SECTIONS = ['Graduation Issue','Tennis','Basketball','Soccer','Golf','Lacross'];

// get all document under given taxonomy path ex. ["News", "University"]
taxonomy.docs = function(taxonomyPath, limit, callback) {
    db.taxonomy.docs(taxonomyPath, limit, callback);
}

taxonomy.getHierarchy = function(callback) {
    db.taxonomy.getHierarchy(function(err,response)
    {
        var currentLevel = {};
        var hierarchy = currentLevel;

        for(i in response) {
            var sectionArray = response[i]['key']; 
            for(j in sectionArray) {
                var section = sectionArray[j];
                if(BAD_SECTIONS.indexOf(section) != -1) continue;
                
                if(j != sectionArray.length-1) {
                    if(currentLevel[section] == null) {
                        currentLevel[section] = {};
                    }
                    currentLevel = currentLevel[section];
                }
                else {
                    if(currentLevel[section] == null) {
                        currentLevel[section] = null;
                    }
                }
            }
            currentLevel = hierarchy;
        }        
        callback(err,hierarchy);
    });
}
