var cron = require('cron');
var rss = require('./rss');

var feeds = [
    {
        title: "sportsblog",
        url: "http://feeds.feedburner.com/chronicleblogs/sports"
    },
    {
        title: "twitter-chronicle",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=dukechronicle"
    },
    {
        title: "twitter-recess",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=chronicleRecess"
    },
    {
        title: "twitter-towerview",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=TowerviewMag"
    },
    {
        title: "twitter-basketball",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=dukebasketball"
    },
    {
        title: "twitter-photo",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=ChronPhoto"
    },
    {
        title: "twitter-sports",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=chroniclesports"
    },
    {
        title: "newsblog",
        url: "http://feeds.feedburner.com/chronicleblogs/news"
    },
    {
        title: "recessblog",
        url: "http://feeds.feedburner.com/chronicleblogs/playground"
    }
];

exports.init = function() {
    new cron.CronJob('0 */30 * * * *', function() { //every 30 minutes
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