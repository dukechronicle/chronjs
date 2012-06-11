define(["jquery", "libs/underscore", "libs/jquery-ui"], function($) {

    return {
        
        ".align-group": loadAfterTypekit(pageAlign),
        ".row .row-story": loadAfterTypekit(truncateTeaser),
        ".block .rounded": loadAfterTypekit(truncateTeaser),
        ".vertical-container": loadAfterTypekit(verticalAlign),
        "header .date": displayDate

    }

    function loadAfterTypekit(callback) {
        return function () {
            var args = arguments;
            var execute = function () {
                callback.apply(this, args);
            }

            if ($('html').hasClass("wf-active") ||
                $('html').hasClass("wf-inactive"))
                execute();
            else setTimeout(execute, 300);
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
            // check for overflow, the +1 is a hack for IE. Oh IE...
            while ($(this)[0].scrollHeight > $(this).outerHeight() + 1) {
                $(this).find(".list-story:last").remove();
            }
        });
    }

    function truncateTeaser($elements) {
        $elements.each(function () {
            while ($(this)[0].scrollHeight > $(this).outerHeight() + 1) {
                var $text = $(this).find("p:last");
                if ($text.length > 0) {
                    $text.text(function (index, text) {
                        return text.replace(/\s+\S*\.*$/, "...");
                    });
                }
                else break;
            }
        });
    }

    function displayDate() {
        var date = $.datepicker.formatDate('DD, MM d, yy', new Date());
        $("header .date").text(date);
    }

});
