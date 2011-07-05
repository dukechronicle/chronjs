$(function() {
	// position vertical labels
	$(".vertical-container").each(function(i) {
		var height = $(this).css('width');
		var topSpacing = 3;
		height = parseInt(height.substring(0, height.length - 2), 10) + topSpacing;
		$(this).css('top', height + "px");
	});

	// align rows
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
	var extraHeight = $('#sidebar').height()-$('#main').height();
	//console.log(extraHeight);
	var contentContainer = $('#main .top-news .content-container');
	var currentPadding = contentContainer.css('padding-bottom');
	contentContainer.css('padding-bottom', 3 + extraHeight);
	//console.log($('#sidebar').height()-$('#main').height())
/*
	$(".hover-highlight").each(function(i) {
		var element = $(this);
		element.onmouseover(function() {
			element.find('a').addClass('selected');
			element.find('p').addClass('selected');
		});

		element.onmouseout(function() {
			element.find('a').removeClass('selected');
			element.find('p').removeClass('selected');
		})
	});*/

});
