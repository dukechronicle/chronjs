require.config({
    baseUrl: '/js',
    paths: {
        'order': '/js/libs/order'
    }
});

require(['admin/crop','admin/deleteArticle','admin/html5upload',
         'admin/imgdelete','admin/json-to-form','admin/k4export',
         'admin/layout','admin/newsletter','admin/nicedate']);
