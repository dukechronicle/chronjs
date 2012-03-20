require.config({
    baseUrl: '/js',
    paths: {
        'jquery': 'libs/jquery'
    }
});

require(['admin/crop','admin/deleteArticle','admin/html5upload',
         'admin/imgdelete','admin/json-to-form','admin/k4export',
         'admin/layout','admin/newsletter','admin/nicedate']);
