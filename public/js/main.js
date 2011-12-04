require.config({
    paths: {
        'galleria': '/js/galleria/galleria-1.2.5.min',
        'underscore': '/js/underscore-min',
        'typekit' : 'http://use.typekit.com/dwv2bjy'
    }
});

require(["jquery", "align", "typekit"], function($, align) {
    try {
    	Typekit.load({
    		active: function() {
                align.pageAlign();
                if (isFront) align.frontpageAlign();
                align.verticalAlign();
    		}
    	});
    } catch(e) {}

    if (isFront()) {
        require(["slideshow/frontpage-slideshow"], function(slideshow) {
            slideshow.init();
        });
    }

});


function isFront() {
    return ! document.location.href.split("/")[3];
}