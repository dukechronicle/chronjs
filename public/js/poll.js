define(['jquery'], function ($) {

    var voted = false;
    var total = 1;

    $(function () {
        
        $(".choice").each(function () {
            total += parseInt($(this).attr("votes"));
        });

        $(".choice > a").click(function(e) {
            e.preventDefault();

            var $choice = $(this).parent();

            if (!voted) {
                voted = true;

                var id = $(".poll > .container").attr("id");
                var answer = $choice.attr("id");
                $choice.attr("votes", function (index, votes) {
                    return parseInt(votes) + 1;
                });

                $.post('/api/poll/vote', { id: id, answer: answer });

                $(".choice").each(function () {
                    var percent = parseInt($(this).attr("votes")) / total;
                    $(this).append("<p>"+Math.round(percent * 100) + "%</p>");
                    $(this).append("<div>");
                    $(this).children(":last")
                        .addClass("bar")
                        .css("width", 0)
                        .animate({
                            width: $(this).width() * percent
                        }, 1000);
                });
            }
        });
            
    });

});