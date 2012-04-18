var newsletter = {};
var exports = module.exports = newsletter;

var MailChimpAPI = require('mailchimp').MailChimpAPI;
var api = require('./api');
var _ = require('underscore');
var async = require('async');
var log = require('../../log');
var jade = require('jade');
var fs = require('fs');
var config = require('../../config');

var apiKey = null;
var layoutGroups = null;
var listID = null;
var templateID = null;
var mcAPI = null;

var ARTICLE_IMAGE_WIDTH = 124;
var ARTICLE_IMAGE_HEIGHT = 89;

var newsletterFromEmail = null;
var newsletterFromName = "The Chronicle";

newsletter.init = function() {
    apiKey = config.get("MAILCHIMP_API_KEY");
    layoutGroups = config.get("LAYOUT_GROUPS");
    listID = config.get("MAILCHIMP_LIST_ID");

    templateID = config.get("MAILCHIMP_TEMPLATE_ID");

    newsletterFromEmail = "no-reply@"+config.get('DOMAIN_NAME').replace("www.", "");

    try { 
        mcAPI = new MailChimpAPI(apiKey, { version : '1.3', secure : false });
    } catch (error) {
        log.warning(error);
    }
};

function getNewsletterSubject() {
    return "Duke Chronicle Daily Newsletter " + getDate();
}

function getDate() {
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
}

newsletter.sendTestNewsletter = function(campaignID, emailToSendTo, callback) {
    var params = {"test_emails":[emailToSendTo], "cid":campaignID};
    mcAPI.campaignSendTest(params, function (res) {
        if (res === false) {
            log.warning("Sending Campaign failed!");
            callback("Sending Campaign failed!");
        }
        else callback();
    });
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

newsletter.sendNewsletter = function (campaignID, callback) {
    mcAPI.campaignSendNow({cid:campaignID}, function (res) {
        if (res === false) {
            log.warning("Sending Campaign failed!");
            return callback("Sending Campaign failed!");
        }
        return callback(null);
    });
};

newsletter.createNewsletter = function (callback) {
    var optArray = {"list_id":listID, "subject":getNewsletterSubject(), "from_email":newsletterFromEmail, "from_name":newsletterFromName, "title":getNewsletterSubject(), "template_id":templateID};
    
    api.group.docs(layoutGroups.Newsletter.namespace, null, function (err, model) {
    fs.readFile('views/newsletter.jade', function (err, data) {
        var newsHTML = jade.compile(data)({
        model: model
        });
            var adHTML = "<a href='www.google.com'><img src='https://www.google.com/help/hc/images/adsense_185666_adformat-display_160x600_en.jpg'></img></a>";

            // disable test ad
            adHTML = "";

            var contentArr = {"html_MAIN":newsHTML, "html_ADIMAGE":adHTML, "html_ISSUEDATE":getDate()};
            var params = {"type":"regular", "options":optArray, "content":contentArr};

            mcAPI.campaignCreate(params, function (res) {
        if (res.error) {
                    log.warning('Error: ' + res.error + ' (' + res.code + ')');
                    callback('Error: ' + res.error + ' (' + res.code + ')');
        }
        else {
            log.info("Campaign ID: " + res);
            callback(null, res);
        }
            });
    });
    });         
};
