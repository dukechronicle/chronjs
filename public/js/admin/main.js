require.config({
    baseUrl: '/js',
});

require(['admin/crop','admin/deleteArticle','admin/html5upload',
         'admin/imgdelete','admin/json-to-form','admin/k4export',
         'admin/layout','admin/newsletter','admin/nicedate'], function () {
             $(function () {
                 if (typeof CHRONICLE == "object" && CHRONICLE.onload)
                     for (var i in CHRONICLE.onload)
                         CHRONICLE.onload[i]();
             });
         });
