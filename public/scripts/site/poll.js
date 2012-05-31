define(['jquery'], function ($) {

    var total = 0;
    var voted = false;

    return { ".poll": displayPoll }

    function displayPoll() {

        $(".poll .choice").each(function () {
            total += $(this).data("votes");
        });

        $(".poll .choice > a").click(function(e) {
            e.preventDefault();

            var $choice = $(this).parent();
            
            if (!voted) {
                voted = true;

                var id = $(".poll").attr("id");
                var answer = $choice.attr("id");

                $choice.data('votes', $choice.data('votes') + 1);
                total++;
                $.post('/api/poll/' + id + '/vote', { answer: answer });
                
                showResults();
            }
        });

        if (voted) showResults();
    }

    function showResults() {
        $(".poll .choice").each(function () {
            var percent = $(this).data('votes') / total;
            $(this).append('<span class="vote-count">'+Math.round(percent * 100) + '%</span>');
            var $bar = $('<div>')
                .addClass("bar")
                .css("width", 0)
                .animate({
                    width: $(this).width() * percent
                }, 1000);
            $(this).append($bar);
        });
    }

});