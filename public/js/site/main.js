// All Javascript files used by the main site -- align must be first
var SCRIPTS = ['site/align','site/article','site/opinion','site/scrollLoad',
               'site/slideshow/frontpage-slideshow','site/slideshow/slideshow'];

require.config({
    baseUrl: '/js',
    paths: {
        'order': '/js/libs/order.js',
        'galleria': '/js/galleria/galleria-1.2.5'
    }
});

require(SCRIPTS, function (align) {
    loadAfterTypekit(function() {
        align.pageAlign();
        if (page() === 'front') align.frontpageAlign();
        align.verticalAlign();
    })
});

function loadAfterTypekit(callback) {
    if ($('html').hasClass("wf-active") || $('html').hasClass("wf-inactive")) {
        callback();
    } else {
        var retry = function() {loadAfterTypekit(callback)};
        setTimeout(retry, 300)
    }
}

function page() {
    var path = document.location.href.split("/")[3];
    if (! path) {
        return "front";
    } else {
        return path.split("#")[0];
    }
}
