define(["jquery", "galleria/galleria-1.2.5"], function($) {

    var GALLERIA_THEME = '/js/galleria/themes/frontpage-slideshow/galleria.frontpage-slideshow.js';

    return {

        ".slideshow.galleria": function () {
            Galleria.loadTheme(GALLERIA_THEME);
            $("#slides").galleria({
                transition: "fade",
                autoplay: 9000,
                width: 636,
                height: 393
            });
        }

    };

});
