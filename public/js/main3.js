require.config({
    paths: {
        'backbone': '/js/libs/backbone-min',
        'galleria': '/js/galleria/galleria-1.2.5',
        'underscore': '/js/libs/underscore-min'
    }
});

require(['align'], function (align) {
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


if (typeof window.THE_CHRONICLE != 'undefined' && typeof window.THE_CHRONICLE.scripts != 'undefined') {
    var scripts = window.THE_CHRONICLE.scripts;
    for (var i = 0; i < scripts.length; i++) {
        var scriptParts = scripts[i].split("?");

        require({ urlArgs: scriptParts[1] }, [scriptParts[0]], function (module) {
            if (module && typeof module.init == 'function') module.init();
        });
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
