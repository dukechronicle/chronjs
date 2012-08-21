require.config({
    baseUrl: '/scripts',
});

require(['cs!common/main','admin/crop','admin/delete-article',
         'admin/delete-image','admin/json-to-form','admin/k4export',
         'admin/layout','admin/newsletter','admin/nicedate',
         'cs!admin/form-field','cs!admin/taxonomy','admin/html5upload'],
        function (main) {
            main.apply(this, arguments);
        });
