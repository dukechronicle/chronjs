var newsletter = {};
var exports = module.exports = newsletter;

var MailChimpAPI = require('mailchimp').MailChimpAPI;
var api = require('./api');
var _ = require('underscore');
var async = require('async');
var log = require('../../log');
var config = require('../../config');

var apiKey = config.get("MAILCHIMP_API_KEY");
var taxonomyGroups = config.get("TAXONOMY_MAIN_SECTIONS");

var numDocs = 1;

var listID = config.get("MAILCHIMP_LIST_ID");
var templateID = config.get("MAILCHIMP_TEMPLATE_ID");

// Strings
var date = getDate();
var newsletterSubject = "Duke Chronicle Daily Newsletter " + date;
var newsletterFromEmail = "chronicle@duke.edu";

try { 
    var mcAPI = new MailChimpAPI(apiKey, { version : '1.3', secure : false });
} catch (error) {
    log.warning(error);
}

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
}

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
    var name = "Newsletter " + date;
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
    var optArray = {"list_id":listID, "subject":newsletterSubject, "from_email":newsletterFromEmail, "from_name":"The Chronicle", "title":"Newsletter " + date, "template_id":templateID};

    async.map(taxonomyGroups, function (item, callback) {
                log.debug(item);
                api.taxonomy.docs(item, numDocs, function (err, docs) {
                    if (err)
                        return callback(err, null);
                    return callback(err, docs);
                });
            },
            function (err, res) {

                var newsText = "";
                var newsHTML = "";

                for (var x = 0; x < taxonomyGroups.length; x++) {
                    newsHTML += "<h2>" + taxonomyGroups[x] + "</h2>";
                    newsHTML += "<p>" + res[x][0].value.teaser + "</p>";
                    newsText += res[x][0].value.teaser;
                }

                var sideBarText = "SideBar Text";
                var footerText = "Footer Text";
                var eventsText = "Some events";
                var contentArr = {"html_MAIN":newsHTML, "html_SIDECOLUMN":sideBarText, "html_FOOTER":footerText, "html_ISSUEDATE":date, "html_EVENTS":eventsText, "text":newsText};
                log.info(contentArr);

                var params = {"type":"regular", "options":optArray, "content":contentArr};
                mcAPI.campaignCreate(params, function (res) {
                    if (res.error) {
                        log.warning('Error: ' + res.error + ' (' + res.code + ')');
                        return callback('Error: ' + res.error + ' (' + res.code + ')');
                    }
                    log.info("Campaign ID: " + res);
                    callback(null);
                });
            });
};

