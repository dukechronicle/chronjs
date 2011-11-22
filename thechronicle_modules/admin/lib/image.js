var globalFunctions = require('../../global-functions');
var async = require('async');
var s3 = require('../../api/lib/s3.js');
var im = require('imagemagick');
var site = require('../../api/lib/site.js');
var fs = require('fs');
var api = require('../../api/lib/api.js');
var urlModule = require('url');
var _ = require("underscore");

var VALID_EXTENSIONS = {};
VALID_EXTENSIONS['image/jpeg'] = 'jpg';
VALID_EXTENSIONS['image/png'] = 'png';
VALID_EXTENSIONS['image/gif'] = 'gif';

var IMAGE_TYPES = {
    LargeRect: {
        width: 636,
        height: 393,
        description: "Used for the main image on the article page, as well as for the slideshow"
    },
    ThumbRect: {
        width: 186,
        height: 133,
         description: "Dean, add a description here"
    },
    ThumbRectL: {
        width: 276,
        height: 165,
        description: "Dean, add a description here"
    },
    ThumbSquareM: {
        width: 183,
        height: 183,
        description: "Dean, add a description here"
    },
    ThumbWide: {
        width: 300,
        height: 120,
        description: "Dean, add a description here"
    }
};

var THUMB_DIMENSIONS = '100x100';

function _deleteFiles(paths, callback) {
    async.reduce(paths, [], function(memo, item, callback) {
        memo.push(function(acallback) {
            fs.unlink(item, acallback);
        });
        callback(null, memo);
    },
    function(err, result) {
        async.series(result, callback);
    });
}

function _getMagickString(x1, y1, x2, y2) {
    var w = x2 - x1;
    var h = y2 - y1;
    return w.toString() + 'x' + h.toString() + '+' + x1.toString() + '+' + y1.toString();
}

function _downloadUrlToPath(url, path, callback) {
    var urlObj = urlModule.parse(url);
    log.info('host: ' + urlObj.host);
    var options = {
        host: urlObj.host,
        port: 80,
        path: urlObj.pathname
    };
    http.get(options, function(res) {
        res.setEncoding('binary');
        var data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            fs.writeFile(path, data, 'binary', function(err) {
                callback(err);
            });
        });
    });
}

exports.bindPath = function (app) {
    return function () {

        app.get('/manage', site.checkAdmin, function (req, httpRes) {
            var beforeKey = req.query.beforeKey;
            var beforeID = req.query.beforeID;
            var forArticle = req.query.forArticle;

            api.image.getAllOriginals(beforeKey, beforeID, function (err, origs) {
                httpRes.render('admin/articleimage', {
                    filename:'views/admin/articleimage.jade',
                    locals:{
                        origs:origs,
                        url:forArticle,
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
                                                            imageTypes:Object.keys(IMAGE_TYPES),
                                                            article:req.query.article,
                                                            imageDetails:IMAGE_TYPES
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
                    var data = {};
                    var id = req.body.id; //assign id from req
                    data.name = req.body.name; //fills entries of data from req
                    data.caption = req.body.caption;
                    data.photographer = req.body.photographer;
                    data.location = req.body.location;

                    // make sure date stays numeric so it can be sorted correctly
                    data.date = parseInt(req.body.date);
                    if(isNaN(data.date)) data.date = req.body.date;

                    api.image.edit(id, data, function () {  //passes the recently create "id" and "data" and an anonymous function to image.edit, which calls another function from db
                        httpRes.redirect('/admin/image/' + data.name); //redirects image to domain name /admin/image/data.name
                    });

                });

        app.post('/crop', site.checkAdmin,
                function (req, httpRes) {
                    var imageName = req.body.name; // assign "name" and "article" from parameter "req"
                    var article = req.body.article;
                    var geom = _getMagickString( //MagickString takes coordinates and puts that info into a string
                            parseInt(req.body.x1),
                            parseInt(req.body.y1),
                            parseInt(req.body.x2),
                            parseInt(req.body.y2));
                    var width = req.body.finalWidth; // assign "width" and "height" from req
                    var height = req.body.finalHeight;
                    var croppedName = ''; //initialize croppedName

                    async.waterfall([
                        function (callback) {
                            api.image.getOriginal(imageName, callback); //getOriginal gets image from the database
                        },
                        function (orig, callback) {
                            croppedName = 'crop_' + orig.value.name; // modify the croppedName
                            log.info(orig.value.url);
                            _downloadUrlToPath(orig.value.url, orig.value.name,
                                    function (err) {
                                        callback(err, orig);
                                    });
                        },
                        function (orig, callback) {
                            im.convert([orig.value.name, '-crop', geom,
                                '-resize', width.toString() + 'x' + height.toString(), croppedName],  //crop image with given specifications
                                    function (imErr, stdout, stderr) {
                                        callback(imErr, orig);
                                    });
                        },
                        function (orig, callback) {
                            fs.readFile(croppedName,
                                    function (err, buf) {
                                        callback(err, orig, buf);
                                    });
                        },
                        function (orig, buf, callback) {
                            var versionNum = orig.value.imageVersions.length + 1; //increments the version number by 1
                            var type = orig.value.contentType; // takes the type from orig
                            var s3Name = versionNum + orig.value.name;
                            s3.put(buf, s3Name, type, //put command from s3 
                                    function (s3Err, url) {
                                        callback(s3Err, orig, url);
                                    });
                        },
                        function (orig, url, callback) {
                            api.image.createVersion(orig.id, url, width, height, //createVersion calls a function from the database that creates an image
                                    function (err, res) {
                                        callback(err, orig);
                                    });
                        },
                        function (orig, callback) {
                            _deleteFiles([orig.value.name, croppedName], //calls a function defined earlier, which passes arguments to async.reduce()
                                    function (err) {
                                        callback(err, orig);
                                    }
                            );
                        }
                    ],
                            function (err, orig) {
                                if (err) {
                                    globalFunctions.showError(httpRes, err); //check for an error
                                } else {
                                    if (article) httpRes.redirect('/admin/image/' + imageName + '?article=' + article); //if there is an article, redirect to this domain
                                    else httpRes.redirect('/admin/image/' + imageName); // otherwise, redirect to this domain
                                }
                            }
                    );
                });
    }
};
