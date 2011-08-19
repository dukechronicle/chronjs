var smtp = {};
var exports = module.exports = smtp;

var nodemailer = require('nodemailer');
var redisclient = require('./redisclient');
var DB_LIST_NAME = "subscriberList";

smtp.addSubscriber = function(subscriberEmail, callback){
    redisclient.client.sadd(DB_LIST_NAME, subscriberEmail, function(err, res){
        console.log(subscriberEmail);
        if(err)
            console.log(err);
        callback(err,res);
    });
}

smtp.removeSubscriber = function(subscriberEmail, callback){
    redisclient.client.srem(DB_LIST_NAME, subscriberEmail, function(err, res){
        console.log(subscriberEmail);
        if(err)
            console.log(err);
        callback(err,res);
    });
}

smtp.getSubscribers = function(callback)
{
    redisclient.client.smembers(DB_LIST_NAME, function(err, res){
        if(err)
            console.log(err);
        callback(err,res);
    });
}

var sgusername = "app578498@heroku.com";
var sgpassword = "0acabbaccfeafbb35a";

nodemailer.SMTP = {
    host: 'smtp.sendgrid.net', // required
    port: 587, // optional, defaults to 25 or 465
    use_authentication: true, // optional, false by default
    user : sgusername,
    pass : sgpassword
}

function generateHTML(msgBody)
{
    jsdom.env({
        html: "<html><body></body></html>",
        scripts: [
            'http://code.jquery.com/jquery-1.5.min.js'
        ]
    }, function (err, window) {
        var $ = document.getElementById;

        $('body').append("<div class='testing'>Hello World</div>");
    });

    return $('html').html();
}

function generatePlainText(msgBody)
{
    var plainText;

    for(i in msgBody)
    {
        var article = msgBody[i];
        plainText.append(article.title + "\n");
        plainText.append(article.teaser + "\n");
        plainText.append("\n\n");
    }
    return plainText;
}

smtp.sendNewsletter = function(msgBody,callback)
{
    console.log(msgBody);
    var htmlMsg = generateHTML(msgBody);
    var bodyMsg = generatePlainText(msgBody);
    smtp.getSubscribers(function(err,res){
        for(i in res)
        {
             var emailDest = res[i]; 
             console.log(emailDest);

             /*nodemailer.send_mail(
                    sender : "chronicle@duke.edu",
                    to : emailDest,
                    subject : "This is a subject",
                    body: "Hello, this is a test body",
                    html: "<b> test</b>alskdfj",
                },
                function(err2, result){
                    if(err2){
                        console.log(err2);
                    }
                }
             );*/
        }
        callback(err,res);
    });
}
