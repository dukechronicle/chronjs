define(["jquery", "libs/jquery.metadata", "libs/jquery.openxtag.min"], function($) {
    $(function() {
        console.log("test")
        $.openxtag('init', {
            delivery: '/xhrproxy/openx'
        });

        $('.openx-ad').openxtag('spc', -1);
    });
});
