define(["jquery", "galleria/galleria-1.2.5"], function($) {

    var GALLERIA_THEME = '/js/galleria/themes/frontpage-slideshow/galleria.frontpage-slideshow.js';


    return function() {
        if ($(".slideshow.galleria").length > 0) {
            Galleria.loadTheme(GALLERIA_THEME);

            $(".slideshow.galleria #slides").galleria({
                transition: "fade",
                autoplay: 9000,
                width: 636,
                height: 393
            });
        }
    };

});
