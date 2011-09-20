$(function(){
	var currentSlide = 0;
	var nextSlide = 0;
	var totalSlides = $('.slideshow .slides img').size();

	var positions  = [106, 318, 530];
	// start by showing only the first sldie
    $('.slideshow .slides img:gt(0)').hide();
    $('.slideshow .slides .text a:gt(0)').hide();
    $('.slideshow .slides .text h1:gt(0)').hide();
    $('.slideshow .slides .text h2:gt(0)').hide();
    $('.slideshow .headlines a:eq(0)').addClass('active');

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

        $('.slideshow .slides .text a:eq(' + currentSlide + ')').fadeOut('active');
        $('.slideshow .slides .text a:eq(' + newSlide + ')').fadeIn('active');
    
        $('.slideshow .slides .text h1:eq(' + currentSlide + ')').fadeOut('slow');
        $('.slideshow .slides .text h1:eq(' + newSlide + ')').fadeIn('slow');

        $('.slideshow .slides .text h2:eq(' + currentSlide + ')').fadeOut('slow');
        $('.slideshow .slides .text h2:eq(' + newSlide + ')').fadeIn('slow');

	    $('.slideshow .headlines a:eq(' + currentSlide + ')').removeClass('active');
	    $('.slideshow .headlines a:eq(' + newSlide + ')').addClass('active');

		currentSlide = newSlide;
	}

	// bind headlines to slideshow switches
	$('.slideshow .headlines a').each(function(index) {
		$(this).click(function() {
			if (index != currentSlide) {
				showSlide(index);
				$('.slideshow b.caret').css('-webkit-transform', 'translate(' +
						parseInt(positions[index], 10) + 'px, 0px)')
			}
		})
	});
});