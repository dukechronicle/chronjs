require.config({
    baseUrl: '/js'
});

require(['jquery', 'jquery-ui', 'jquery.Jcrop']);

if (typeof scripts != 'undefined') {
    for (var i in scripts) {
        require([scripts[i]], function (module) {
            if (module && typeof module.init == 'function')
                module.init();
        });
    }
}