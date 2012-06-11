var cron = require('cron');
var rss = require('./rss');
var log = require('../../log');
var config = require('../../config');

var initialized = false;


exports.init = function () {  
    if (!initialized) {
        initialized = true;

        // In a multi-instance setup, it may be possible that the config was
        // changed on one instance, and those changes should replicate to all
        // instances. Runs every half hour.
        new cron.CronJob('0 0,30 * * * *', loadConfiguration).start();

        if(process.env.NODE_ENV === 'production') {
            new cron.CronJob('0 * * * * *', loadRSSFeeds).start();
        }
    }
};


function loadConfiguration() {
    config.checkForUpdatedConfig(function(updated) {
        if(updated) {
            log.notice("Config updated to use revision " + config.getConfigRevision());
            config.runAfterConfigChangeFunction(function (err) {
                if (err) log.error(err);
            });
        }
    });
}

function loadRSSFeeds() {
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
}