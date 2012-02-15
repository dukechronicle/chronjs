require.config({
    baseUrl: '/js'
});

if (typeof scripts != 'undefined') {
    for (var i in scripts) {
        require([scripts[i]], function (module) {
            if (module && typeof module.init == 'function')
                module.init();
        });
    }
}