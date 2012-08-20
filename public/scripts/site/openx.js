define(["jquery", "libs/jquery.metadata", "libs/jquery.openxtag"], function($) {

    return {

        ".openx-ad": function () {
            $.openxtag('init', {
                delivery: 'http://www.oncampusweb.com/delivery',
                deliverySSL: 'https://www.oncampusweb.com/delivery',
            });

            $('.openx-ad').openxtag('spc', -1);
        }

    }

});
