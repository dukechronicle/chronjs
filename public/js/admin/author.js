define(['jquery'], function ($) {

    $(function() {

        $("#findAuthorButton").click(function(event) {
            event.preventDefault();

            window.location.href = "/admin/author?name=" + $("#authorName").attr('value');
        });
    });
});
