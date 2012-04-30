define(['jquery', 'libs/jquery-ui'], function ($) {

    return { newsletter: initNewsletterForm }

    function initNewsletterForm () {

        $("form#test").submit(function (e) {
            e.preventDefault();
            sendNewsletter($(this), 'Test sent');
        });

        $("form#send").submit(function (e) {
            e.preventDefault();
            form = $(this);
            $("#newsletter-confirm").dialog('open');
        });

        $("#newsletter-confirm").dialog({
            resizable: false,
            autoOpen: false,
            height:140,
            modal: true,
            buttons: {
                Send: function() {
                    sendNewsletter($("form#send"), 'Newsletter sent', function(){
                        $("#newsletter-confirm").dialog('close');
                    });
                },
                Cancel: function() {
                    $("#newsletter-confirm").dialog('close');
                }
            }
        });

    };

    function sendNewsletter(form, onSentText, callback) {
        $.post('/admin/newsletter', form.serialize(), function (msg) {
            if (msg == "sent")
                $("#message").html(onSentText).addClass('alert-message success');
            else
                $("#message").html("Could not send").addClass('alert-message error');

            if (callback) callback();
        });
    }

});