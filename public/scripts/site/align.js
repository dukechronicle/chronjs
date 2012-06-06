define(["jquery", "libs/underscore", "libs/jquery-ui"], function($) {

    return {
        
        ".align-group": loadAfterTypekit(pageAlign),
        ".row .row-story": loadAfterTypekit(truncateTeaser),
        ".vertical-container": loadAfterTypekit(verticalAlign),
        "header .date": displayDate

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
        // Iterate through align groups in reverse order so nested groups
        // get aligned first
        var groups = $(".align-group").get().reverse();
        $(groups).each(function () {
            // Align inner elements first
            var elements = $(this).children('.align-element');
            var primary = _.max(elements, function (element) {
                if ($(element).data('alignprimary'))
                    return Infinity;
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

            // In case any story lists boxes were made smaller
            truncateStoryList();
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

    function truncateStoryList() {
        $(".story-list .rounded").each(function () {
            while ($(this)[0].scrollHeight > $(this).outerHeight()) {
                $(this).find(".list-story:last").remove();
            }
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

    function displayDate() {
        var date = $.datepicker.formatDate('DD, MM d, yy', new Date());
        $("header .date").text(date);
    }

});
