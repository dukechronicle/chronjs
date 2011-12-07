require.config({
    paths: {
        'galleria': '/js/galleria/galleria-1.2.5.min',
        'underscore': '/js/underscore-min',
        'typekit' : 'http://use.typekit.com/dwv2bjy'
    }
});

require(["align", "typekit"], function(align) {
    try {
    	Typekit.load({
    		active: function() {
                align.pageAlign();
                if (page() === 'front') align.frontpageAlign();
                align.verticalAlign();
    		}
    	});
    } catch(e) {}

    if (page() === 'front') {
        require(["slideshow/frontpage-slideshow"], function(slideshow) {
            slideshow.init();
        });
    } else if (page() === 'sports') {
        require(["slideshow/slideshow"], function(slideshow) {
            slideshow.init();
        });
    }

});


function page() {
    var path = document.location.href.split("/")[3];
    if (! path) {
        return "front";
    } else {
        return path;
    }
}