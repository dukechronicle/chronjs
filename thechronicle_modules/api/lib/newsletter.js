var newsletter = exports;

var async = require('async');
var dateFormat = require('dateformat');
var fs = require('fs');
var jade = require('jade');
var mailchimp = require('mailchimp');
var _ = require('underscore');

var api = require('./api');
var log = require('../../log');
var config = require('../../config');

var mcAPI = null;

var ARTICLE_IMAGE_WIDTH = 124;
var ARTICLE_IMAGE_HEIGHT = 89;
var NEWSLETTER_FROM_EMAIL;
var NEWSLETTER_FROM_NAME = 'The Chronicle';


newsletter.init = function() {
    NEWSLETTER_FROM_EMAIL = "no-reply@"+config.get('DOMAIN_NAME').replace("www.", "");

    var apiKey = config.get("MAILCHIMP_API_KEY");
    try {
        mcAPI = new mailchimp.MailChimpAPI(apiKey, {version : '1.3', secure : true});
    } catch (error) {
        log.error(error);
    }
};

newsletter.sendTestNewsletter = function (campaignID, emailToSendTo, callback) {
    var options = {
        test_emails: [emailToSendTo],
        cid: campaignID
    };
    mcAPI.campaignSendTest(options, function (res) {
        if (!res) callback("Sending Campaign failed!");
        else callback();
    });
};

newsletter.addSubscriber = function (subscriberEmail, callback) {
    var options = {
        id: config.get('MAILCHIMP_LIST_ID'),
        email_address: subscriberEmail,
        send_welcome: true
    };
    mcAPI.listSubscribe(options, function (res) {
        if (!res) callback("Adding subscriber to list failed!");
        else callback();
    });
};

newsletter.removeSubscriber = function (subscriberEmail, callback) {
    var options = {
        id: config.get('MAILCHIMP_LIST_ID'),
        email_address: subscriberEmail,
        delete_member: true,
        send_welcome: true,
        send_goodbye: false
    };
    mcAPI.listUnsubscribe(options, function (res) {
        if (!res) callback("Removing subscriber to list failed!");
        else callback();
    });
};

newsletter.sendNewsletter = function (campaignID, callback) {
    mcAPI.campaignSendNow({cid:campaignID}, function (res) {
        if (!res) callback("Sending Campaign failed!");
        else callback(null);
    });
};

newsletter.createNewsletter = function (callback) {
    var options = {
        list_id: listID,
        subject: getNewsletterSubject(),
        from_email: newsletterFromEmail,
        from_name: newsletterFromName,
        title: getNewsletterSubject(),
        template_id: config.get('MAILCHIMP_TEMPLATE_ID'),
    };

    var namespace = config.get('LAYOUT_GROUPS').Newsletter.namespace;
    api.group.docs(namespace, null, function (err, model) {
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

function getNewsletterSubject() {
    return "Duke Chronicle Daily Newsletter " + getDate();
}

function getDate() {
    return dateFormat(newDate, 'm/d/yyyy');
}