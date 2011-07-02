$(document).ready(function() {
	$('body a.list-story').mouseover(function() {$(this).animate({'border-right-color': '#4D90F0'}, 200)});
	$('body a.list-story').mouseout(function() {$(this).animate({'border-right-color': 'white'}, 200)});
});