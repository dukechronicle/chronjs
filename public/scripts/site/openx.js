define(["jquery", "libs/jquery.metadata", "libs/jquery.openxtag.min"], function($) {

    return {

        ".openx-ad": function () {
            $.openxtag('init', {
                delivery: '/xhrproxy/openx'
            });
            
            $('.openx-ad').openxtag('spc', -1);
        }

    }

});
