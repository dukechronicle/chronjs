$(document).ready(
function position() {
	$(".vertical-container").each(function(i) {
		var height = $(this).css('width');
		height = parseInt(height.substring(0, height.length - 2), 10) + 5;
		console.log(height);
		$(this).css('top', height + "px");
	});
}
);
