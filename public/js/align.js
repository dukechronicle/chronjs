//$(function() {	// align rows
function pageAlign() {
	// find all align groups
	$(".align-group").each(function(i) {
		var groups = [];

		// find all elements of align group and add it to group array
		$(this).find('> .align-element').each(function(i) {
			groups.push($(this).find('> a'))
		});
		//console.log(_.zip.apply(this, groups))
		_.each(_.zip.apply(this, groups), function(row) {
			// get max height of current row
			var maxHeight = 0;
			_.each(row, function(element) {
				var height = $(element).height();
				if (height > maxHeight) {
					maxHeight = height;
					//console.log(maxHeight)
				}
			});
			_.each(row, function(element) {
				$(element).height(maxHeight);
			});
		});
	});

	// align main and sidebar height
	(function() {
		// sidebar is short by 1px for some reason
		var extraHeight = $('#top > .sidebar').height()-$('#top > .content').height() - 1;
		console.log(extraHeight);
		//console.log(extraHeight);
		var contentContainer = $('#top > .content .top-news .content-container');
		var currentPadding = contentContainer.css('padding-bottom');
		contentContainer.css('padding-bottom', 3 + extraHeight);

		console.log($('#top > .sidebar').height()-$('#top > .content').height());
	}) ();
}
//});