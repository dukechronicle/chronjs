require.config({
    baseUrl: '/assets/scripts'
});

require(['site/align','site/article','site/opinion','site/scrollLoad',
         'site/slideshow/frontpage-slideshow','site/slideshow/slideshow',
         'site/openx', 'facebook'],
        function (align) {
            var args = Array.prototype.slice.call(arguments);
            loadAfterTypekit(args.shift()); // align after typekit loads
            $(function () {
                for (var i in args)
                    if (typeof args[i] == 'function')
                        args[i]();
            });
        });

function loadAfterTypekit(callback) {
    if ($('html').hasClass("wf-active") || $('html').hasClass("wf-inactive")) {
        callback();
    } else {
        var retry = function() {loadAfterTypekit(callback)};
        setTimeout(retry, 300)
    }
}
