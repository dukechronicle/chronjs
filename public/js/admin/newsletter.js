define(['jquery'], function ($) {

    $(function () {
        $("form#test").submit(function (e) {
            e.preventDefault();
            sendNewsletter($(this), 'Test sent');
        });

        $("form#send").submit(function (e) {
            e.preventDefault();
            if(areYouSure())
                sendNewsletter($(this), 'Newsletter sent');
        });
    });

    function areYouSure() {
        return confirm("Are you sure you want to send the newsletter to everyone?");
    }

    function sendNewsletter(form,onSentText) {
        $.post('/admin/newsletter', form.serialize(), function (msg) {
            if (msg == "sent")
                $("#message").html(onSentText);
            else
                $("#message").html("Could not send");
        });
    }

});