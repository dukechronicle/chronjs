var displayPoll;

define(['jquery'], function ($) {

    var total = 0;

    displayPoll = function (voted) {

        $(".poll .choice").each(function () {
            total += parseInt($(this).attr("votes"));
        });

        $(".poll .choice > a").click(function(e) {
            e.preventDefault();

            var $choice = $(this).parent();
            
            if (!voted) {
                voted = true;

                var id = $(".poll > .container").attr("id");
                var answer = $choice.attr("id");
                $choice.attr("votes", function (index, votes) {
                    total++;
                    return parseInt(votes) + 1;
                });

                $.post('/api/poll/vote', { id: id, answer: answer });
                
                showResults();
            }
        });

        if (voted) showResults();

    }

    function showResults() {
        $(".poll .choice").each(function () {
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