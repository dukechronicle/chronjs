require.config({
    baseUrl: '/scripts'
});

require(['site/align','site/article','site/category-box','site/scrollLoad',
         'site/slideshow/frontpage-slideshow','site/slideshow/slideshow-right',
         'site/openx', 'site/poll', 'libs/jquery.cookie', 'facebook'],
        function () {
            var args = Array.prototype.slice.call(arguments);
            $(function () {
                for (var i in args) {
                    var functions = args[i];
                    for (var selector in functions)
                        if (!selector || $(selector).length > 0)
                            functions[selector]();
                }
            });
        });
