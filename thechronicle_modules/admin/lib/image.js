var globalFunctions = require('../../global-functions');
var config = require('../../config');
var async = require('async');
var site = require('../../api/lib/site.js');
var fs = require('fs');
var api = require('../../api/lib/api.js');
var _ = require("underscore");

var VALID_EXTENSIONS = {};
VALID_EXTENSIONS['image/jpeg'] = 'jpg';
VALID_EXTENSIONS['image/png'] = 'png';
VALID_EXTENSIONS['image/gif'] = 'gif';

var THUMB_DIMENSIONS = '100x100';

exports.bindPath = function (app) {
    return function () {

        app.get('/manage', site.checkAdmin, function (req, httpRes) {
            var beforeKey = req.query.beforeKey;
            var beforeID = req.query.beforeID;
            var afterUrl = req.query.afterUrl;
            var forDocument = req.query.forDocument;

            api.image.getAllOriginals(beforeKey, beforeID, function (err, origs) {
                httpRes.render('admin/articleimage', {
                    filename:'views/admin/articleimage.jade',
                    locals:{
                        origs:origs,
                        afterUrl:afterUrl,
                        docId:forDocument,
                        hasPrevious:(beforeID != null)
                    },
                    layout:'layout-admin.jade'
                });
            });
        });

        app.get('/upload', site.checkAdmin,
                function (req, httpRes) {
                    httpRes.render('upload', {
                        layout:"layout-admin.jade"
                    });
                });

        app.post('/upload', site.checkAdmin,
                function (req, httpRes) {
                    var imageData = req.body.imageData;
                    var imageName = req.body.imageName;
                    // create a unique name for the image to avoid s3 blob collisions
                    imageName = globalFunctions.randomString(8) + "-" + imageName;
                    var thumbName = 'thumb_' + imageName;
                    var imageType = req.body.imageType;
                    var imageID = req.body.imageID;

                    // use async library to call these functions in series, passing vars between them
                    async.waterfall([
                        function (callback) {
                            if (!imageType in VALID_EXTENSIONS) {
                                callback("Invalid file type for " + imageName + ". Must be an image.");
                            }
                            else {
                                callback(null)
                            }
                        },
                        function (callback) {
                            var buf = new Buffer(imageData, 'base64');
                            fs.writeFile(imageName, buf,
                                    function (err) {
                                        callback(err);
                                    });
                        },
                        function (callback) {
                            api.image.createOriginalFromFile(imageName, imageType, true, callback);
                        }
                    ],
                            function (err, result, url) {
                                if (err) {
                                    globalFunctions.log(err);

                                    if (typeof(err) == "object") {
                                        err = "Error";
                                    }

                                    globalFunctions.sendJSONResponse(httpRes, {
                                        error:err,
                                        imageID:imageID
                                    });
                                }
                                else {
                                    globalFunctions.log('Image uploaded: ' + url + ' and stored in DB: ' + result);
                                    globalFunctions.sendJSONResponse(httpRes, {
                                        imageID:imageID,
                                        imageName:imageName
                                    });
                                }
                            });
                });
                
        app.get('/articles', site.checkAdmin,
                function (req, httpRes) {
                    var id = req.query.id;
                    var func = api.image.docsForVersion;
                    if(req.query.orig && req.query.orig == '1')
                        func = api.image.docsForOriginal;
                        
                    func(id, function(err, res) {
                        globalFunctions.sendJSONResponse(httpRes, res);
                    });
                });
                
        app.get('/delete', site.checkAdmin,
                function (req, httpRes) {
                    var id = req.query.id;
                    if(req.query.orig && req.query.orig == '1') {
                        api.image.deleteOriginal(id, function(err, res) {
                            var ret = (err != null);
                            globalFunctions.sendJSONResponse(httpRes, {ok: ret});
                        });
                    } else {
                        api.image.deleteVersion(id, true, function(err, res) {
                            var ret = (err != null);
                            globalFunctions.sendJSONResponse(httpRes, {ok: ret});
                        })
                    }
                });

        app.get('/:imageName', site.checkAdmin,
                function (req, httpRes) {  //this function either renders image or calls showError if there is an error
                    var imageName = req.params.imageName; //get image name from req
                    api.image.getOriginal(imageName,
                            function (err, orig) { //anonymous function checks for an error
                                if (err) globalFunctions.showError(httpRes, err); //show this message if there is an error
                                else {
                                    api.docsById(orig.value.imageVersions,
                                            function (err2, versions) {
                                                if (err2) globalFunctions.showError(httpRes, err2); // if an error is found, 
                                                else {
                                                    var imageTypes = config.get('IMAGE_TYPES');

                                                    httpRes.render('admin/image', { //no errors have been found, render image
                                                        locals:{ //specifies/assigns variables to pass into function
                                                            url:orig.value.url,
                                                            name:imageName,
                                                            id:orig.value._id,
                                                            caption:orig.value.caption,
                                                            location:orig.value.location,
                                                            photographer:orig.value.photographer,
                                                            date:orig.value.date,
                                                            versions:versions,
                                                            imageTypes:Object.keys(imageTypes),
                                                            afterUrl:req.query.afterUrl,
                                                            docId:req.query.docId,
                                                            imageDetails:imageTypes
                                                        },
                                                        layout:"layout-admin.jade"
                                                    });
                                                }
                                            })
                                }
                            });
                });

        app.post('/info', site.checkAdmin,
                function (req, httpRes) {
                    var id = req.body.id; //assign id from req
                    var afterUrl = req.body.afterUrl;
                    var docId = req.body.docId;

                    var data = {};
                    data.name = req.body.name; //fills entries of data from req
                    data.caption = req.body.caption;
                    data.photographer = req.body.photographer;
                    data.location = req.body.location;

                    // make sure date stays numeric so it can be sorted correctly
                    data.date = parseInt(req.body.date);
                    if(isNaN(data.date)) data.date = req.body.date;

                    api.image.edit(id, data, function () {  //passes the recently create "id" and "data" and an anonymous function to image.edit, which calls another function from db
                        if (docId)
                            if (afterUrl) httpRes.redirect('/admin/image/' + data.name + '?afterUrl=' + afterUrl + '&docId=' + docId);
                            else httpRes.redirect('/admin/image/' + data.name + '?docId=' + docId);
                        else httpRes.redirect('/admin/image/' + data.name);                        
                    });

                });

        app.post('/crop', site.checkAdmin, function (req, httpRes) {
            var imageName = req.body.name;
            var afterUrl = req.body.afterUrl;
            var docId = req.body.docId;
            var width = req.body.finalWidth;
            var height = req.body.finalHeight;

            api.image.createCroppedVersion(imageName, width, height, req.body.x1, req.body.y1, req.body.x2, req.body.y2, function (err, orig) {
                if (err) {
                    globalFunctions.showError(httpRes, err); //check for an error
                }
                else {
                    if (docId)
                        if (afterUrl) httpRes.redirect('/admin/image/' + imageName + '?afterUrl=' + afterUrl + '&docId=' + docId);
                        else httpRes.redirect('/admin/image/' + imageName + '?docId=' + docId);
                    else httpRes.redirect('/admin/image/' + imageName);
                }
            });
        });
    };
};
