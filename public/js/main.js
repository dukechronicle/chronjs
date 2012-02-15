require.config({
    paths: {
        'galleria': '/js/galleria/galleria-1.2.5',
        'underscore': '/js/underscore-min',
        'typekit' : 'http://use.typekit.com/dwv2bjy'
    }
});

require(["align", "site"], function (align) {
    Typekit.load({
        active: function () {
            align.pageAlign();
            if (page() === 'front') align.frontpageAlign();
            align.verticalAlign();        
        }
    });
});

if (typeof window.THE_CHRONICLE != 'undefined' && typeof window.THE_CHRONICLE.scripts != 'undefined') {
    window.THE_CHRONICLE.scripts.forEach(function(script) {
        require([script], function (module) {
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