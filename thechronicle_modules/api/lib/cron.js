var cron = require('cron');
var rss = require('./rss');

var feeds = [{
    title: "sportsblog",
    url: "http://sports.chronicleblogs.com/feed/"
}];

exports.init = function() {
    new cron.CronJob('0 0 * * * *', function() { //every hour?
        feeds.forEach(function(feed) {
            rss.parseRSS(feed.url, function(err, dom) {
                if(err) console.log(err);
                else {
                    rss.storeRSS(dom, title, function(err, res) {
                        if(err) console.log(err);
                    });
                }
            });
        });
    });
}