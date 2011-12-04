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
				}
			});
			_.each(row, function(element) {
				$(element).height(maxHeight);
			});
		});
	});

	// align main and sidebar height
	(function() {
        var popularLiHeight = 24;

		var extraHeight = $('#top > .sidebar').height()-$('#top > .content').height() + 3;
		var contentContainer = $('#top > .content .top-news .content-container');
        var popularContainer = $('#top > .sidebar .most-popular .content-container');

        console.log(extraHeight);
        if (extraHeight > 0) {
            var lisToRemove = Math.floor(extraHeight/popularLiHeight);
            console.log(lisToRemove);

            var removeIndex = $("li", popularContainer).size() - lisToRemove - 1;
            if (removeIndex < 2) {
                removeIndex = 2;
                lisToRemove = $("li", popularContainer).size() - removeIndex - 1;
            }
            console.log(removeIndex);
            $("li:gt(" + removeIndex + ")", popularContainer).hide();
            extraHeight -= lisToRemove * popularLiHeight;
        }
        console.log("extra height: " + extraHeight);
        contentContainer.css('padding-bottom', extraHeight);
        console.log($('#top > .sidebar').height()-$('#top > .content').height());
	}) ();
}
//});