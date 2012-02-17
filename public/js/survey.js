define(['jquery'], function ($) {

    var voted = false;

    $(function () {
        
        $(".choice > a.hover").click(function (e) {
            e.preventDefault();
            if (!voted) {
                voted = true;
                $(".choice").each(function () {
                    $(this).append("<div>");
                    $(this).children(":last")
                        .addClass("bar")
                        .css("width", 0)
                        .animate({
                            width: 200 * $(this).attr("votes")
                        }, 1000);
                });
            }
        });
            
    });

});