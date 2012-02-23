require.config({
    baseUrl: '/js',
    paths: {
        'backbone': '/js/libs/backbone-min',
        'underscore': '/js/libs/underscore-min'
    }
});

if (typeof scripts != 'undefined') {
    for (var i in scripts) {
        var scriptParts = scripts[i].split("?");

        require({ urlArgs: scriptParts[1] }, [scriptParts[0]], function (module) {
            if (module && typeof module.init == 'function')
                module.init();
        });
    }
}
