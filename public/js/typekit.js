try {
	Typekit.load({
		active: function() {
			pageAlign();
			verticalAlign();
		}
	});
} catch(e) {
}