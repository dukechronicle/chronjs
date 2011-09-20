try {
	Typekit.load({
		active: function() {
            if (pageAlign) {
			    pageAlign();
            }
            if (verticalAlign) {
			    verticalAlign();
            }
		}
	});
} catch(e) {
}