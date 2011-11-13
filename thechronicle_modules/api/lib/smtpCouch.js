var smtp = {};
var exports = module.exports = smtp;

var db = require("../../db-abstract");
var nodemailer = require('nodemailer');

var DB_LIST_NAME = "subscriberList";

/*
@param {array} array List of all subscriber emails
@param {object} obj object representing a specific subscriber, including the email of that subscriber
@return true if obj email is contained in array of subscriber emails, false if not.
*/

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
/*
@param {String} subscriberEmail email of subscriber that you would like to add to list of subscriber emails.
@return add a subscriber's email to emailList and save db
*/

smtp.addSubscriber = function(subscriberEmail, callback){
    db.get(DB_LIST_NAME,function(err, res){
        if(err && err.error != 'not_found') 
            callback(err);

        var emailEntry = {email: subscriberEmail};  
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
/*
@param {String} email email to delete from list of subscriber emails
@param {emailList} list of all subscriber emails
@return if email of subscriber is in emailList then delete it from emailList.
*/

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
/*
@param subscriberEmail {String} email of subscriber to remove from emailList.
@return delete email if it exists from emailList and update db.
*/
smtp.removeSubscriber = function(subscriberEmail, callback){
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

/*
@param {String} msgBody message to send to subscribers
@return sends message to all subscribers
*/

smtp.sendNewsletter = function(msgBody,callback)
{
    console.log(msgBody);
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
