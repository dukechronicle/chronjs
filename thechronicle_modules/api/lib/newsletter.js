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
    var domain = 'www.dukechronicle.com';
    NEWSLETTER_FROM_EMAIL = 'no-reply@' + domain.replace('www.', '');

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
    mcAPI.campaignSendTest(options, callback);
};

newsletter.addSubscriber = function (subscriberEmail, callback) {
    var options = {
        id: config.get('MAILCHIMP_LIST_ID'),
        email_address: subscriberEmail,
        send_welcome: true
    };
    mcAPI.listSubscribe(options, callback);
};

newsletter.removeSubscriber = function (subscriberEmail, callback) {
    var options = {
        id: config.get('MAILCHIMP_LIST_ID'),
        email_address: subscriberEmail,
        delete_member: true,
        send_welcome: true,
        send_goodbye: false
    };
    mcAPI.listUnsubscribe(options, callback);
};

newsletter.sendNewsletter = function (campaignID, callback) {
    mcAPI.campaignSendNow({cid:campaignID}, callback);
};

newsletter.createNewsletter = function (callback) {
    getNewsletterContent(function (err, newsHTML, adHTML) {
        if (err) return callback(err);

        var options = {
            type: 'regular',
            options: {
                list_id: config.get('MAILCHIMP_LIST_ID'),
                subject: getNewsletterSubject(),
                from_email: NEWSLETTER_FROM_EMAIL,
                from_name: NEWSLETTER_FROM_NAME,
                title: getNewsletterSubject(),
                template_id: config.get('MAILCHIMP_TEMPLATE_ID'),
            },
            content: {
                html_MAIN: newsHTML,
                html_ADIMAGE: adHTML,
                html_ISSUEDATE: getDate()
            },
        };
        mcAPI.campaignCreate(options, function (err, res) {
            if (err) return callback(err);
            log.info('Campaign ID: ' + res);
            callback(null, res);
        });
    });
};

function getNewsletterContent(callback) {
    var namespace = config.get('LAYOUT_GROUPS').Newsletter.namespace;
    api.group.docs(namespace, null, function (err, model) {
        if (err) return callback(err);
        fs.readFile('views/newsletter.jade', function (err, data) {
            if (err) return callback(err);
            var newsHTML = jade.compile(data)({
                model: model
            });
            var adHTML = "<a href='www.google.com'><img src='https://www.google.com/help/hc/images/adsense_185666_adformat-display_160x600_en.jpg'></img></a>";

            // disable test ad
            adHTML = "";
            callback(null, newsHTML, adHTML);
        });
    });
}

function getNewsletterSubject() {
    return "Duke Chronicle Daily Newsletter " + getDate();
}

function getDate() {
    return dateFormat(new Date, 'm/d/yyyy');
}
