define(['jquery', 'libs/jquery-ui'], function ($) {

    return {
        
        "#newsletter": function () {

            $("#newsletter #message").hide();
            
            $("#newsletter #test").submit(function (e) {
                e.preventDefault();
                sendNewsletter($(this), 'Test sent');
            });

            $("#newsletter #send").submit(function (e) {
                e.preventDefault();
                $("#confirm").dialog('open');
            });

            $("#newsletter #confirm").dialog({
                resizable: false,
                autoOpen: false,
                height:140,
                modal: true,
                buttons: {
                    Send: function() {
                        sendNewsletter($("#send"), 'Newsletter sent', function() {
                            $("#confirm").dialog('close');
                        });
                    },
                    Cancel: function() {
                        $("#confirm").dialog('close');
                    }
                }
            });

        }

    }

    function sendNewsletter(form, onSentText, callback) {
        $.post('/admin/newsletter', form.serialize(), function (msg) {
            if (msg == "sent")
                $("#message").html(onSentText).addClass('success').show();
            else
                $("#message").html("Could not send").addClass('error').show();

            if (callback) callback();
        });
    }

});