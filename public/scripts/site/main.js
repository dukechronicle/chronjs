require.config({
    baseUrl: '/scripts'
});

require(['cs!common/main', 'site/align','cs!site/article','site/category-box','site/scrollLoad',
         'site/slideshow/frontpage-slideshow','site/slideshow/slideshow-right',
         'cs!site/openx', 'site/poll', 'lib/jquery.cookie', 'site/facebook'],
        function (main) {
            main(arguments);
        });
