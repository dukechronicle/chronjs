require.config({
    paths: {
        'order': '/js/libs/order.js',
        'galleria': '/js/galleria/galleria-1.2.5'
    }
});

require(["align", "site"], function (align) {
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
    window.THE_CHRONICLE.scripts.forEach(function(script) {
        var scriptParts = script.split("?");
    
        require({ urlArgs: scriptParts[1] }, [scriptParts[0]], function (module) {
            if (module && typeof module.init == 'function') module.init();
        });
    })
}

function page() {
    var path = document.location.href.split("/")[3];
    if (! path) {
        return "front";
    } else {
        return path.split("#")[0];
    }
}
