// All Javascript files used by the admin pages
var SCRIPTS = ['admin/crop','admin/deleteArticle','admin/html5upload',
               'admin/imgdelete','admin/json-to-form','admin/k4export',
               'admin/layout','admin/newsletter','admin/nicedate']

require.config({
    baseUrl: '/js',
    paths: {
        'order': '/js/libs/order'
    }
});

require(SCRIPTS);
