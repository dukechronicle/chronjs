define(["jquery", "libs/underscore"], function($) {

    return {
        
        ".align-group": loadAfterTypekit(pageAlign),
        ".row .row-story": loadAfterTypekit(truncateTeaser),
        ".vertical-container": loadAfterTypekit(verticalAlign)

    }

    function loadAfterTypekit(callback) {
        var retry;
        return retry = function () {
            if ($('html').hasClass("wf-active") ||
                $('html').hasClass("wf-inactive"))
                callback();
            else setTimeout(retry, 300)
        }
    }

    function pageAlign() {
        $(".align-group").each(function () {
            var elements = $(this).children('.align-element');
            var primary = _.max(elements, function (element) {
                return $(element).height();
            });

            _.each(elements, function (element) {
                var target = $(element).data('aligntarget');
                target = target ? $(element).find(target) : element;

                var delta = $(primary).height() - $(element).height();
                $(target).height(function (index, height) {
                    return height + delta;
                });
            });
        });
    }

    // position vertical labels
    function verticalAlign() {
        var extra = 10;
        $(".vertical-container .vertical").each(function() {
            var height = $(this).width();
            $(this).css('left', -height + extra + "px");
            $(this).css('visibility', 'visible');

            var rounded = $(this).parent().siblings(".rounded");
            if (rounded && rounded.height() < height)
                rounded.css('height', height + "px");
        });
    }

    function truncateTeaser() {
        $(".row .row-story").each(function () {
            while ($(this)[0].scrollHeight > $(this).outerHeight()) {
                $(this).children("p").text(function (index, text) {
                    return text.replace(/\s+\S*\.*$/, "...");
                });
            }
        });
    }

});
