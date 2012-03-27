require.config({
    baseUrl: '/js'
});

require(['site/align','site/slideshow/slideshow','site/scrollLoad','site/poll',
         'site/slideshow/frontpage-slideshow','site/article','site/opinion'],
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
