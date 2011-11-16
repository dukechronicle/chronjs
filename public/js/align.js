//$(function() {	// align rows
function pageAlign() {
	// find all align groups
	$(".align-group").each(function() {
		var groups = [];
		// find all elements of align group and add it to group array

		$(this).find('> .align-element').each(function() {
            var alignTarget = $(this).attr('data-alignTarget');

            if (!alignTarget) {
                console.log("Aligntarget missing for ");
                console.log($(this));
                return;
            }
            groups.push($(this).find(alignTarget));
		});

        if (groups.length === 0) return;

		_.each(_.zip.apply(this, groups), function(row) {
			// get max height of current row
			var maxHeight = 0;
			_.each(row, function(element) {
				var height = $(element).height();
				if (height > maxHeight) {
					maxHeight = height;
					console.log(maxHeight)
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
		var extraHeight = $('#top > .sidebar').height()-$('#top > .content').height();

		var contentContainer = $('#top > .content .top-news .content-container');
        contentContainer.css('padding-bottom', extraHeight);
	}) ();
}
//});