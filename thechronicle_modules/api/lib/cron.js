var cron = require('cron');
var rss = require('./rss');
var log = require('../../log');
var config = require('../../config');

exports.init = function () {
    // QUESTION: if init is called multiple times, are new cron jobs created even though they already existed or do they overwrite old cron jobs?   
    if (process.env.NODE_ENV === 'production') {
        new cron.CronJob('0 */30 * * * *', function () { //every 30 minutes
            config.get('RSS_FEEDS').forEach(function (feed) {
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

exports.CronJob = function(whenToRunString, funcToRun) {
    return new cron.CronJob(whenToRunString, funcToRun);
};
