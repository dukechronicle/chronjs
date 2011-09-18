var cron = require('cron');
var rss = require('./rss');

var feeds = [{
    title: "sportsblog",
    url: "http://feeds.feedburner.com/chronicleblogs/sports"
}];

exports.init = function() {
    new cron.CronJob('0 0 * * * *', function() { //every hour?
        feeds.forEach(function(feed) {
            rss.parseRSS(feed.url, function(err, dom) {
                console.log("Parsed RSS for feed: " + feed.title);
                if(err) console.log(err);
                else {
                    rss.storeRSS(dom, feed.title, function(err, res) {
                        if(err) console.log(err);
                        else console.log("Stored RSS for feed: " + feed.title);
                    });
                }
            });
        });
    });
}