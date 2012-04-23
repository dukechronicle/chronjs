require.config({
    baseUrl: '/assets/scripts',
});

require(['admin/crop','admin/delete-article','admin/html5upload',
         'admin/delete-image','admin/json-to-form','admin/k4export',
         'admin/layout','admin/newsletter','admin/nicedate'], function () {
             $(function () {
                 if (typeof CHRONICLE == "object" && CHRONICLE.onload)
                     for (var i in CHRONICLE.onload)
                         CHRONICLE.onload[i]();
             });
         });
