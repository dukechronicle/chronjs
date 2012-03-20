define(["jquery", "galleria"], function($) {

    $(function() {
        Galleria.loadTheme('/js/galleria/themes/frontpage-slideshow/galleria.frontpage-slideshow.js');
        $("#slides").galleria({
            transition: "fade",
            autoplay: 9000,
            width: 636,
            height: 393
        });
    });

});
