define(["jquery", "galleria/galleria-1.2.5"], function($) {

    return function() {
        if ($(".slideshow.vertical").length > 0) {
            Galleria.loadTheme('/js/galleria/themes/frontpage-slideshow/galleria.frontpage-slideshow.js');
            $(".slideshow.vertical #slides").galleria({
                transition: "fade",
                autoplay: 9000,
                width: 636,
                height: 393
            });
        }
    };

});
