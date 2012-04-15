require.config({
    baseUrl: '/js'
});

require(['site/align','site/article','site/opinion','site/scrollLoad',
         'site/slideshow/frontpage-slideshow','site/slideshow/slideshow', 'site/openx'],
        function (align) {
            loadAfterTypekit(align);
            $(function () {
                if (typeof CHRONICLE == "object" && CHRONICLE.onload)
                    for (var i in CHRONICLE.onload)
                        CHRONICLE.onload[i]();
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
