var cron = require('cron');
var rss = require('./rss');
var log = require('../../log');
var config = require('../../config');

var madeInitialCronJobs = false;

exports.init = function () {  
    if (!madeInitialCronJobs) {
        madeInitialCronJobs = true;

        new cron.CronJob('0 */30 * * * *', function () { //every 30 minutes
            
            // in a multi-instance setup, it may be possible that the config was changed on 1 instance, and those changes should replicate to all instances            
            config.checkForUpdatedConfig(function(updated) {
                 if(updated) {
                    log.notice("Config updated to use revision " + config.getConfigRevision());
                    config.runAfterConfigChangeFunction(function (err) {
		                if (err) log.error(err);
                    });
                }
            });            

            if(process.env.NODE_ENV === 'production') {
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
        });
    }
};

exports.CronJob = function(whenToRunString, funcToRun) {
    return new cron.CronJob(whenToRunString, funcToRun);
};
