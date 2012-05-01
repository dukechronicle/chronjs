require.config({
    baseUrl: '/assets/scripts',
});

require(['admin/crop','admin/delete-article','admin/html5upload',
         'admin/delete-image','admin/json-to-form','admin/k4export',
         'admin/layout','admin/newsletter','admin/nicedate'],
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
