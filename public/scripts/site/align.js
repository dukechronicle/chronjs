define(["jquery", "libs/underscore"], function($) {

    return {
        
        ".align-group": loadAfterTypekit(pageAlign),
        ".block-row .row-story": loadAfterTypekit(truncateTeaser),
        ".vertical-container": loadAfterTypekit(verticalAlign),
        "#not #frontpage": loadAfterTypekit(frontpageAlign)

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
            var groups = [];
            var primary = null;
            // find all elements of align group and add it to group array

            $(this).children('.align-element').each(function () {
                var alignTarget = $(this).data('aligntarget');
                var isPrimary = $(this).data('alignprimary');
                var element = alignTarget ? $(this).find(alignTarget) : $(this);

                if (isPrimary)
                    primary = element
                groups.push(element);
            });

            if (groups.length === 0) return;

            _.each(_.zip.apply(this, groups), function (row) {
                // get max height of current row
                var primary = primary || _.max(row, function (element) {
                    return $(element).height();
                });
                _.each(row, function (element) {
                    $(element).height($(primary).height());
                });
            });
        });
    }

    function frontpageAlign() {
        // align main and sidebar height
        var popularLiHeight = 40;

        var extraHeight = $('#top > .sidebar').height() - $('#top > .content').height() + 3;
        var contentContainer = $('#top > .content .top-news .content-container');
        var popularContainer = $('#top > .sidebar .most-popular .content-container');

        if (popularContainer.length > 0) {
            //console.log(extraHeight);
            if (extraHeight > 0) {
                var lisToRemove = Math.floor(extraHeight / popularLiHeight);
                //console.log(lisToRemove);

                var removeIndex = $("li", popularContainer).size() - lisToRemove - 1;
                if (removeIndex < 2) {
                    removeIndex = 2;
                    lisToRemove = $("li", popularContainer).size() - removeIndex - 1;
                }
                //console.log(removeIndex);
                $("li:gt(" + removeIndex + ")", popularContainer).hide();
                extraHeight -= lisToRemove * popularLiHeight;
            }
        }
        //console.log("extra height: " + extraHeight);
        contentContainer.css('padding-bottom', extraHeight);
        //console.log($('#top > .sidebar').height() - $('#top > .content').height());
    }

    function overflowFix() {
        $('.auto-fix-overflow').each(function(index) {
            $(this);
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
        $(".block-row .row-story").each(function () {
            while ($(this)[0].scrollHeight > $(this).outerHeight()) {
                $(this).children("p").text(function (index, text) {
                    return text.replace(/\s+\S*\.*$/, "...");
                });
            }
        });
    }

});
