var newsletter = {};
var exports = module.exports = newsletter;

var MailChimpAPI = require('mailchimp').MailChimpAPI;
var api = require('./api');
var _ = require('underscore');
var async = require('async');
var log = require('../../log');
var config = require('../../config');
var globalFunctions = require('../../global-functions');

var apiKey = null;
var taxonomyGroups = null;
var listID = null
var templateID = null;
var mcAPI = null;

var NUM_ARTICLES_IN_EACH_CATEGORY = 3;
var ARTICLE_IMAGE_WIDTH = 186;
var ARTICLE_IMAGE_HEIGHT = 133;

var newsletterFromEmail = "no-reply@dukechronicle.com";
var newsletterFromName = "The Chronicle";

newsletter.init = function() {
    apiKey = config.get("MAILCHIMP_API_KEY");
    taxonomyGroups = config.get("TAXONOMY_MAIN_SECTIONS");
    listID = config.get("MAILCHIMP_LIST_ID");
    templateID = config.get("MAILCHIMP_TEMPLATE_ID");

    try { 
        mcAPI = new MailChimpAPI(apiKey, { version : '1.3', secure : false });
    } catch (error) {
        log.warning(error);
    }
}

function getNewsletterSubject() {
    return "Duke Chronicle Daily Newsletter " + getDate();
};

function getDate()
{
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;//January is 0!
    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd;
    }   
    if(mm<10){
        mm='0'+mm;
    }  
    return mm+'/'+dd+'/'+yyyy;
};

newsletter.addSubscriber = function (subscriberEmail, callback) {
    var params = {"id":listID, "email_address":subscriberEmail, "send_welcome":true};
    mcAPI.listSubscribe(params, function (res) {
        if (res === false) {
            log.warning("Adding subscriber to list failed!");
            return callback("Adding subscriber to list failed!");
        }
        callback(null);
    });
};

newsletter.removeSubscriber = function (subscriberEmail, callback) {
    var params = {"id":listID, "email_address":subscriberEmail, "delete_member":true, "send_welcome":true, "send_goodbye":false};
    mcAPI.listUnsubscribe(params, function (res) {
        if (res === false) {
            log.warning("Removing subscriber to list failed!");
            return callback("Removing subscriber to list failed!");
        }
        callback(null);
    });
};

newsletter.sendNewsletter = function (callback) {
    var name = getNewsletterSubject();
    log.info(name);
    mcAPI.campaigns({ start:0, limit:1, filters:{"title":name}}, function (res) {
        if (res.error) {
            log.warning(res.error + ' (' + res.code + ')');
            return callback('Error: ' + res.error + ' (' + res.code + ')');
        }

        log.debug(JSON.stringify(res)); // Do something with your data!

        var campaignID = res.data[0].id;
        log.info(campaignID);

        mcAPI.campaignSendNow({cid:campaignID}, function (res2) {
            log.debug(res2);
            if (res2 === false) {
                log.warning("Sending Campaign failed!");
                return callback("Sending Campaign failed!");
            }
            return callback(null);
        });
    });
};

newsletter.createNewsletter = function (callback) {
    var optArray = {"list_id":listID, "subject":getNewsletterSubject(), "from_email":newsletterFromEmail, "from_name":newsletterFromName, "title":getNewsletterSubject(), "template_id":templateID};
    
    taxonomyGroups = globalFunctions.convertObjectToArray(taxonomyGroups);

    async.map(taxonomyGroups, function (item, callback) {
        api.taxonomy.docs(item, NUM_ARTICLES_IN_EACH_CATEGORY, function (err, docs) {
            if (err) return callback(err, null);
            return callback(err, docs);
        });
    },
    function (err, res) {
        var imageIDs = [];
        for (var x = 0; x < taxonomyGroups.length; x++) {
            for(var i = 0; i < NUM_ARTICLES_IN_EACH_CATEGORY; i ++) {
                if(res[x][i].value.images != null && res[x][i].value.images.ThumbRect != null) {
                    imageIDs.push(res[x][i].value.images.ThumbRect);
                }
            }
        }

        api.docsById(imageIDs, function(err, imageResponse) {
            var newsText = "";
            var newsHTML = "";
            var imageCount = 0;

            for (var x = 0; x < taxonomyGroups.length; x++) {
                newsHTML += "<h2>" + taxonomyGroups[x] + "</h2>";
                newsText += taxonomyGroups[x]+"\n\n";

                for(var i = 0; i < NUM_ARTICLES_IN_EACH_CATEGORY; i ++) {
                    var url = "http://www.dukechronicle.com/article/"+res[x][i].value.urls[0];

                    newsHTML += "<br />";
                        
                    if(res[x][i].value.images != null && res[x][i].value.images.ThumbRect != null) {
                        newsHTML += "<a href='" + url + "'><img src='"+imageResponse[imageCount].doc.url+"' width='"+ARTICLE_IMAGE_WIDTH+"' height='"+ARTICLE_IMAGE_HEIGHT+"'></img></a>";                 
                        imageCount ++;
                    }                        

                    newsHTML += "<a href='" + url + "'><h3>" + res[x][i].value.title + "</h3></a>";
                    newsHTML += "<p>" + res[x][i].value.teaser + "</p>";

                    newsText += res[x][i].value.title+"\n";
                    newsText += res[x][i].value.teaser+"\n";
                    newsText += url+"\n";
                    newsText += "\n";
                }
                newsHTML += "<br />";
                newsText += "\n";
            }

            var sideBarText = "SideBar Text";
            var footerText = "Footer Text";
            var eventsText = "Some events";
            var contentArr = {"html_MAIN":newsHTML, "html_SIDECOLUMN":sideBarText, "html_FOOTER":footerText, "html_ISSUEDATE":getDate(), "html_EVENTS":eventsText, "text":newsText};

            var params = {"type":"regular", "options":optArray, "content":contentArr};
            mcAPI.campaignCreate(params, function (res) {
                if (res.error) {
                    log.warning('Error: ' + res.error + ' (' + res.code + ')');
                    return callback('Error: ' + res.error + ' (' + res.code + ')');
                }
                log.info("Campaign ID: " + res);
                callback(res);
            });
        });
    });         
};

