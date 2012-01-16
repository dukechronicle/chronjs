function areYouSure() {
    var agree=confirm("Are you sure you want to send the newsletter to everyone?");
    
   return agree;
}

function _sendNewsletter(form,onSentText) {
    $.ajax({
        type: "POST",
        url: "/admin/newsletter",
        data: $(form).serialize()
    }).done(function(msg) {
        if(msg == "sent") {
            $("#message").html(onSentText);
        }
        else {
            $("#message").html("Could not send");
        }
    });
}

function sendNewsletter(form,prompt,onSentText) {
   if(prompt) {
        if(areYouSure())
        {
            _sendNewsletter(form,onSentText);
        }
   }
   else {
        _sendNewsletter(form,onSentText);
   }
}
