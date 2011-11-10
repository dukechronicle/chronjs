var MailChimpAPI = require('mailchimp').MailChimpAPI;
var api = require('./api');
var _ = require('underscore');

var apiKey = '740856b1876fd04723d34bd00aa381d3-us2';
var taxonomyGroups = ["News","Sports","Opinion","Recess","Towerview"];

var numDocs = 1;

try { 
    var mcAPI = new MailChimpAPI(apiKey, { version : '1.3', secure : false });
} catch (error) {
    console.log('Error: ' + error);
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

exports.sendNewsletter = function(callback){
    api.campaigns({ start: 0, limit: 25 }, function (data) {
        if (data.error)
            console.log('Error: '+data.error+' ('+data.code+')');
        else
            console.log(JSON.stringify(data)); // Do something with your data!
    });
}

exports.createNewsletter = function(callback){
    var date = getDate();
    var optArray = {"list_id": "bc302eeb8d", "subject": "Duke Chronicle Daily Newsletter!", "from_email":"chronicle@duke.edu", "from_name":"The Chronicle", "title": "Newsletter " + date, "template_id":233513};

    api.taxonomy.docs("News",numDocs,function(err,res){
        if(err)
            return callback(err,null);
        
        var newsText = "";
        var newsHTML = "";
        console.log("AAAAAAAAAAAAAAAAAAAAAAAAAA");

        for(x=0; x < numDocs; x++)
        {
            newsText += res[x].value.body;
            newsHTML += res[x].value.renderedBody;
        }

        var contentArr = {"html_MAIN":newsText, "html_HEADER":"The Duke Daily Chronicle", "html_SIDECOLUMN":"SIDEEEEE", "html_FOOTER":"MY FOOT!", "html_ISSUEDATE":date, "html_EVENTS": "Cool Events Bro", "html_LOCATION": "Duke University", "html_DATE":"whenever", "text":newsText};
        console.log(contentArr);

        var params = {"type": "regular", "options": optArray, "content": contentArr};
        mcAPI.campaignCreate(params, function(res) {
            if(res.error){
                console.log('Error: '+res.error+' ('+res.code+')');
                return callback();
            }
            console.log("Campaign ID: " + res);
        });
    });
}

