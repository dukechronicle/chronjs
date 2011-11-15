var cron = require('cron');
var rss = require('./rss');
var log = require('../../log');

var feeds = [
    {
        title: "sportsblog",
        url: "http://feeds.feedburner.com/chronicleblogs/sports"
    },
    {
        title: "twitter-DukeChronicle",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=DukeChronicle"
    },
    {
        title: "twitter-ChronicleRecess",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=ChronicleRecess"
    },
    {
        title: "twitter-TowerviewMag",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=TowerviewMag"
    },
    {
        title: "twitter-DukeBasketball",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=dukebasketball"
    },
    {
        title: "twitter-ChronPhoto",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=ChronPhoto"
    },
    {
        title: "twitter-ChronicleSports",
        url: "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=chroniclesports"
    },
    {
        title: "newsblog",
        url: "http://feeds.feedburner.com/chronicleblogs/news"
    },
    {
        title: "recessblog",
        url: "http://feeds.feedburner.com/chronicleblogs/playground"
    },
    {
        title: "blog-opinion",
        url: "http://feeds.feedburner.com/chronicleblogs/backpages"
    }
];

exports.init = function () {
    if (process.env.NODE_ENV === 'production') {
        new cron.CronJob('0 */30 * * * *', function () { //every 30 minutes
            feeds.forEach(function (feed) {
                rss.parseRSS(feed.url, function (err, dom) {
                    log.notice("Parsed RSS for feed: " + feed.title);
                    if (err) log.warning(err);
                    else {
                        rss.storeRSS(dom, feed.title, function (err, res) {
                            if (err) log.warning(err);
                            else log.notice("Stored RSS for feed: " + feed.title);
                        });
                    }
                });
            });
        });
    }
};