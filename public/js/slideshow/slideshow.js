$(function(){
	var currentSlide = 0;
	var nextSlide = 0;
	var totalSlides = $('.slideshow .slides img').size();

	// start by showing only the first sldie
    $('.slideshow .slides img:gt(0)').hide();

	/*
    setInterval(function(){
	    nextSlide = currentSlide + 1;
	    if (nextSlide === totalSlides) nextSlide = 0;
			showSlide(nextSlide);
		}, 6000);*/

	// generic function used to switch from one slide to anoter
	function showSlide(newSlide) {
		$('.slideshow .slides img:eq(' + currentSlide + ')').fadeOut('slow');
	    $('.slideshow .slides img:eq(' + newSlide + ')').fadeIn('slow');

	    $('.slideshow .headlines a:eq(' + currentSlide + ')').removeClass('active');
	    $('.slideshow .headlines a:eq(' + newSlide + ')').addClass('active');

		currentSlide = newSlide;
	}

	// bind headlines to slideshow switches
	$('.slideshow .headlines a').each(function(index) {
		$(this).mouseover(function() {
			if (index != currentSlide) showSlide(index);
		})
	});
});