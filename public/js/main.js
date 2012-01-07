require.config({
    paths: {
        'galleria': '/js/galleria/galleria-1.2.5.min',
        'underscore': '/js/underscore-min',
        'typekit' : 'http://use.typekit.com/dwv2bjy',
        'html5ie' : 'http://html5shim.googlecode.com/svn/trunk/html5'
    }
});

require(["align", "html5ie"], function(align) {
    if (Typekit) {
        alignPage(align);
    } else {
        require(["typekit"], function(Typekit) {
            try{Typekit.load(alignPage(align));}catch(e){}
        })
    }

    if (page() === 'front') {
        require(["slideshow/frontpage-slideshow"], function(slideshow) {
            slideshow.init();
        });
    } else if (page() === 'sports') {
        require(["slideshow/slideshow"], function(slideshow) {
            slideshow.init();
        });
    } else if (page() === 'opinion') {
        require(["opinion"]);
    }
});

function alignPage(align) {
    align.pageAlign();
    if (page() === 'front') align.frontpageAlign();
    align.verticalAlign();
}

function page() {
    var path = document.location.href.split("/")[3];
    if (! path) {
        return "front";
    } else {
        return path.split("#")[0];
    }
}