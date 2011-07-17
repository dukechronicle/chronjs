//$(function() {
function verticalAlign() {
	// position vertical labels
	$(".vertical-container").each(function(i) {
		var height = $(this).css('width');
		var topSpacing = 3;
		height = parseInt(height.substring(0, height.length - 2), 10) + topSpacing;
		$(this).css('top', height + "px");
	});
}

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

//});
