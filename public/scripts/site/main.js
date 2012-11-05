require.config({
    baseUrl: '/scripts'
});

require(['cs!common/main','cs!site/align','cs!site/article','site/category-box',
         'site/scrollLoad','site/slideshow/frontpage-slideshow','site/poll',
         'site/slideshow/slideshow-right','cs!site/openx',  'lib/jquery.cookie',
         'site/facebook', 'cs!site/countdown', 'cs!site/today', 'cs!site/navscroll'],
        function (main) {
            main.apply(this, arguments);
        });
