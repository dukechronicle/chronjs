var cron = require('cron');
var rss = require('./rss');
var log = require('../../log');
var config = require('../../config');

var FEEDS = config.get('RSS_FEEDS');

exports.init = function () {
    if (process.env.NODE_ENV === 'production') {
        new cron.CronJob('0 */30 * * * *', function () { //every 30 minutes
            FEEDS.forEach(function (feed) {
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
