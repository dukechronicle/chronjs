var cron = require('cron');
var rss = require('./rss');

var config = require('../../config');
var log = require('../../log');
var sitemap = require('../../sitemap');

var initialized = false;


exports.init = function () {  
    if (!initialized) {
        initialized = true;

        // In a multi-instance setup, it may be possible that the config was
        // changed on one instance, and those changes should replicate to all
        // instances. Runs every half hour.
        new cron.CronJob('0 0,30 * * * *', loadConfiguration).start();

        // Every half hour
        new cron.CronJob('0 0,30 * * * *', loadRSSFeeds).start();

        // Build full sitemap at 5AM every day
        new cron.CronJob('0 0 5 * * *', function () {
            sitemap.latestFullSitemap('/sitemaps/sitemap', function (err) {
                if (err) log.warning("Couldn't build full sitemap: " + err);
            });
        }).start();

        // Build news sitemap every hour
        new cron.CronJob('0 0 * * * *', function () {
            sitemap.latestNewsSitemap('/sitemaps/news_sitemap', function (err) {
                if (err) log.warning("Couldn't build news sitemap: " + err);
            });
        }).start();
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

function generateFullSitemap() {

}