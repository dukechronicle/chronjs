define(['jquery'], function($) {

    var currentSlide = 0;
    var nextSlide = 0;
    var totalSlides = $('.slideshow-right .slides img').size();

    var positions  = [0, 135, 270];
    // start by showing only the first sldie

    return { "slideshow-right": initSlideshow }


    function initSlideshow () {
        $('.slideshow-right .headlines a:eq(0)').addClass('active');

        // TODO cross browser compatibility
        // bind headlines to slideshow switches
        $('.slideshow-right .headlines a').each(function(index) {
            $(this).click(function(event) {
                if (index != currentSlide) {
                    event.preventDefault();
                    showSlide(index);
                    $('.slideshow-right div.caret').css('-webkit-transform', 'translate(0px, ' + parseInt(positions[index], 10) + 'px) rotate(45deg)');
                }
            });
        });
    }

    /*
      setInterval(function(){
      nextSlide = currentSlide + 1;
      if (nextSlide === totalSlides) nextSlide = 0;
      showSlide(nextSlide);
      }, 6000);*/

    // generic function used to switch from one slide to anoter
    function showSlide(newSlide) {
        $('.slideshow-right .slides img:eq(' + currentSlide + ')').fadeOut('slow');
        $('.slideshow-right .slides img:eq(' + newSlide + ')').fadeIn('slow');

        $('.slideshow-right .slides .text a:eq(' + currentSlide + ')').fadeOut('active');
        $('.slideshow-right .slides .text a:eq(' + newSlide + ')').fadeIn('active');
        
        $('.slideshow-right .slides .text h1:eq(' + currentSlide + ')').fadeOut('slow');
        $('.slideshow-right .slides .text h1:eq(' + newSlide + ')').fadeIn('slow');

        $('.slideshow-right .slides .text h2:eq(' + currentSlide + ')').fadeOut('slow');
        $('.slideshow-right .slides .text h2:eq(' + newSlide + ')').fadeIn('slow');

        var previousLink = $('.slideshow-right .headlines a:eq(' + currentSlide + ')');
        previousLink.removeClass('active');
        var nextLink = $('.slideshow-right .headlines a:eq(' + newSlide + ')')
        nextLink.addClass('active');
        
        currentSlide = newSlide;
    }

});
