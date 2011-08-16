var smtp = {};
var exports = module.exports = smtp;

var db = require("../../db-abstract");
var nodemailer = require('nodemailer');

var DB_LIST_NAME = "subscriberList";

function containsEmail(obj, array){
    for(i in array){
        if(array[i] != null && array[i].email == obj.email)
        {
            console.log(array[i].email);
            return true;
        }
    }
    return false;
}

smtp.addSubscriber = function(subscriberEmail, firstName, lastName, callback){
    db.get(DB_LIST_NAME,function(err, res){
        if(err && err.error != 'not_found') 
            callback(err);

        var emailEntry = {email: subscriberEmail, first: firstName, last: lastName};  
        var emailList = [];
        if(res != null && res.list != null)
        {
            emailList = res.list;  

            // Check if email exists
            if(!containsEmail(emailEntry,emailList))
            {
                emailList.push(emailEntry);
            }
            else
            {
                callback(err,res);
                return;
            }
        }
        else
        {
            // First email of the list, initialize the list.
            emailList = [emailEntry];
        }
        db.save(DB_LIST_NAME,{list: emailList}, callback);
    });
}

function deleteEmailIfExists(email, emailList)
{
    for(i in emailList)
    {
        if(emailList[i].email == email)
        {
            emailList.splice(i,1);
            return;
        }
    }
}

smtp.removeSubscriber = function(subscriberEmail, first, last, callback){
    db.get(DB_LIST_NAME,function(err, res){
        if(err && err.error != 'not_found') 
            callback(err);

        // Get the list, delete entry, update.
        var emailList = res.list;
        deleteEmailIfExists(subscriberEmail, emailList);

        db.save(DB_LIST_NAME, {list: emailList}, callback);
    });
}

smtp.getSubscribers = function(callback)
{
    db.get(DB_LIST_NAME,function(err, res){
        if(err) 
            callback(err);
        if(res == null)
        {
            callback(err, {});
        }
        callback(err, res.list);
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

smtp.sendNewsletter = function(callback)
{
    smtp.getSubscribers(function(err,res){
        console.log(res);
        for(i in res)
        {
             var emailDest = res[i].email; 
             console.log(emailDest);

             nodemailer.send_mail({
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
             );
        }
        callback(err,res);
    });
}
