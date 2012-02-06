var externalAPI = exports;

var api = require('../../api')
var log = require('../../log')


externalAPI.addGroup = function (req, res, next) {
    var docId = req.body.docId;
    var nameSpace = req.body.nameSpace;
    var groupName = req.body.groupName;
    var weight = req.body.weight;

    api.group.add(nameSpace, groupName, docId, weight, function (err, _res) {
        if (err) {
            log.warning(err);
            _res.err = err;
        }
        res.send(_res);
    });
};

externalAPI.removeGroup = function (req, res, next) {
    var docId = req.body.docId;
    var nameSpace = req.body.nameSpace;
    var groupName = req.body.groupName;

    api.group.remove(nameSpace, groupName, docId, function (err, _res) {
        if (err) {
            log.warning(err);
            _res.err = err;
        }
        res.send(_res);
    });
};
