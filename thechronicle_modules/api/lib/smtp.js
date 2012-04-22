var smtp = {};
var exports = module.exports = smtp;

var log = require('../../log');
var nodemailer = require('nodemailer');
var redisclient = require('../../redisclient');
var jsdom = require("jsdom");
var DB_LIST_NAME = "subscriberList";
var $ = require("jquery");

smtp.addSubscriber = function(subscriberEmail, callback){
    redisclient.client.sadd(DB_LIST_NAME, subscriberEmail, function(err, res){
    log.info(subscriberEmail);
        if(err)
            log.warning(err);
        callback(err,res);
    });
};

smtp.removeSubscriber = function(subscriberEmail, callback){
    redisclient.client.srem(DB_LIST_NAME, subscriberEmail, function(err, res){
        log.info(subscriberEmail);
        if(err)
            log.warning(err);
        callback(err,res);
    });
};

smtp.getSubscribers = function(callback)
{
    redisclient.client.smembers(DB_LIST_NAME, function(err, res){
        if(err)
            log.warning(err);
        callback(err,res);
    });
};

var sgusername = "app578498@heroku.com";
var sgpassword = "0acabbaccfeafbb35a";

nodemailer.SMTP = {
    host: 'smtp.sendgrid.net', // required
    port: 587, // optional, defaults to 25 or 465
    use_authentication: true, // optional, false by default
    user : sgusername,
    pass : sgpassword
};

function generateHTML(msgBody, callback)
{
    jsdom.env({
        html: "<html><body></body></html>",
        scripts: [
            'http://code.jquery.com/jquery-1.5.min.js'
        ]
    }, function (err) {

        // Clean out previous items first.
        $('body').empty();

        // Iterate and add each article to generated html.
        Object.keys(msgBody).forEach(function(key) {
            var article = msgBody[key];
            var articleContainer = $('<div />');
            articleContainer.append("<h3>"+ article.title + "</h3>");
            articleContainer.append("<p>" + article.teaser + "</p>");

            $('body').append(articleContainer);
        });

        var ret = "<html>" + $('html').html() + "</html>";
        
        callback(err, ret);
    });
}

function generatePlainText(msgBody)
{
    var plainText = "";

    Object.keys(msgBody).forEach(function(key) {
        var article = msgBody[key];
        plainText += article.title + "\n";
        plainText += article.teaser + "\n";
        plainText += "\n\n";
    });

    return plainText;
}

smtp.sendNewsletter = function(msgBody,callback)
{
    //log.debug(msgBody);
    generateHTML(msgBody, function(err2, htmlres){
        log.debug("htmlmsg");
        log.debug(htmlres);
        var bodyMsg = generatePlainText(msgBody);
        
        smtp.getSubscribers(function(err,res){
            var now = new Date();
            var dateStr = now.toDateString();
            var subjectStr = "[Chronicle Newsletter] " + dateStr + ": Joe wants braces!!!";

            //TODO set emailDest
            var emailDest;

            var mailContent = {
                sender : "chronicle@duke.edu",
                to : emailDest,
                subject : subjectStr,
                body: bodyMsg,
                html: htmlres
            };

            log.info(mailContent);
            Object.keys(res).forEach(function(key) {
                var emailDest = res[key];
                log.info(emailDest);

                /*nodemailer.send_mail(
                 mailContent,
                 function(err3){
                    if(err3){
                        log.warning(err3);
                    }
                 }
                );*/
            });

            callback(err,htmlres);
        });
    });
};
