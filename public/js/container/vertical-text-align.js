$(document).ready(
function position() {
	$(".vertical-container").each(function(i) {
		var height = $(this).css('width');
		var topSpacing = 3;
		height = parseInt(height.substring(0, height.length - 2), 10) + topSpacing;
		console.log(height);
		$(this).css('top', height + "px");
	});
}
);
