require.config({
    paths: {
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

});


function isFront() {
    return ! document.location.href.split("/")[3];
}