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
                align.verticalAlign();
    		}
    	});
    } catch(e) {
    }

})