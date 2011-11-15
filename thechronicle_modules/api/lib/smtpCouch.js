var smtp = {};
var exports = module.exports = smtp;

var log = require('../../log');
var db = require("../../db-abstract");
var nodemailer = require('nodemailer');

var DB_LIST_NAME = "subscriberList";

/**
* @param {array} array List of all subscriber emails
* @param {object} obj object representing a specific subscriber, including the email of that subscriber
* @return true if obj email is contained in array of subscriber emails, false if not.
*/

function containsEmail(obj, array){
    Object.keys(array).forEach(function(key) {
        if(array[key] != null && array[key].email == obj.email) {
            log.debug(array[key].email);
            return true;
        }
    });
    return false;
}
/**
 * @param {String} subscriberEmail email of subscriber that you would like to add to list of subscriber emails.
 * @return add a subscriber's email to emailList and save db
 */

smtp.addSubscriber = function(subscriberEmail, callback) {
    db.get(DB_LIST_NAME, function (err, res) {
        if (err) return callback(err);

        var emailEntry = {email:subscriberEmail};
        var emailList = [];
        if (res != null && res.list != null) {
            emailList = res.list;

            // Check if email exists
            if (!containsEmail(emailEntry, emailList)) {
                emailList.push(emailEntry);
            } else {
                return callback(err, res);
            }
        }
        else {
            // First email of the list, initialize the list.
            emailList = [emailEntry];
        }
        return db.save(DB_LIST_NAME, {list:emailList}, callback);
    });
    return null;
};
/** 
* @param {String} email email to delete from list of subscriber emails
* @param {emailList} list of all subscriber emails
* @return if email of subscriber is in emailList then delete it from emailList.
*/

function deleteEmailIfExists(email, emailList)
{
    Object.keys(emailList).forEach(function(key) {
        if(emailList[key].email == email) {
            emailList.splice(key,1);
        }
    });

    return null;
}
/**
 * @param subscriberEmail {String} email of subscriber to remove from emailList.
 * @return delete email if it exists from emailList and update db.
 */
smtp.removeSubscriber = function(subscriberEmail, callback) {
    db.get(DB_LIST_NAME, function (err, res) {
        if (err) return callback(err);

        // Get the list, delete entry, update.
        var emailList = res.list;
        deleteEmailIfExists(subscriberEmail, emailList);

        return db.save(DB_LIST_NAME, {list:emailList}, callback);
    });
    return null;
};

smtp.getSubscribers = function (callback) {
    db.get(DB_LIST_NAME, function (err, res) {
        if (err)
            callback(err);
        if (res == null) {
            callback(err, {});
        }
        callback(err, res.list);
    });
};

var sgusername = "app578498@heroku.com";
var sgpassword = "0acabbaccfeafbb35a";

nodemailer.SMTP = {
    host:'smtp.sendgrid.net', // required
    port:587, // optional, defaults to 25 or 465
    use_authentication:true, // optional, false by default
    user:sgusername,
    pass:sgpassword
};

/**
 * @param {String} msgBody message to send to subscribers
 * @return sends message to all subscribers
 */

smtp.sendNewsletter = function(msgBody, callback) {
    log.debug(msgBody);
    smtp.getSubscribers(function (err, res) {
        log.debug(res);
        Object.keys(res).forEach(function(key) {
            var emailDest = res[key].email;
            log.debug(emailDest);

            nodemailer.send_mail({
                        sender:"chronicle@duke.edu",
                        to:emailDest,
                        subject:"This is a subject",
                        body:"Hello, this is a test body",
                        html:"<strong> test</strong>alskdfj"
                },
                function (err2) {
                    if (err2) {
                        log.debug(err2);
                    }
                }
            );
        });
        return callback(err, res);
    });
    return null;
};
