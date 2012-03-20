define(['jquery', 'libs/jquery-ui'], function ($) {

    $(function () {

        $("form#test").submit(function (e) {
            e.preventDefault();
            sendNewsletter($(this), 'Test sent');
        });

        $("form#send").submit(function (e) {
            e.preventDefault();
            form = $(this);
            $("#dialog-confirm").dialog('open');
        });

        $("#dialog-confirm").dialog({
            resizable: false,
            autoOpen: false,
            height:140,
            modal: true,
            buttons: {
                Send: function() {
                    sendNewsletter($("form#send"), 'Newsletter sent', function(){
                        $(this).dialog('close');
                    });
                },
                Cancel: function() {
                    $(this).dialog('close');
                }
            }
        });

    });

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