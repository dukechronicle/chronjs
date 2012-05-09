define(["jquery", "libs/underscore"], function($) {

    return {
        
        "#not .align-group": loadAfterTypekit(pageAlign),
        ".block-row .list-story": loadAfterTypekit(truncateTeaser),
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
            // find all elements of align group and add it to group array

            $(this).find('> .align-element').each(function () {
                var alignTarget = $(this).attr('data-alignTarget');

                if (!alignTarget) {
                    console.log("Aligntarget missing for ");
                    console.log($(this));
                    return;
                }
                groups.push($(this).find(alignTarget));
            });

            if (groups.length === 0) return;

            _.each(_.zip.apply(this, groups), function (row) {
                // get max height of current row
                var maxHeight = 0;
                _.each(row, function (element) {
                    var height = $(element).height();
                    if (height > maxHeight) {
                        maxHeight = height;
                    }
                });
                _.each(row, function (element) {
                    $(element).height(maxHeight);
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
            /*
            var rounded = $(this).siblings(".rounded");
            if (rounded &&
                rounded.css('height') &&
                (rounded.css('height').substring(0, rounded.css('height').length - 2) < height)) {
                rounded.css('height', height + "px");
            }
            */
        });
    }

    function truncateTeaser() {
        $(".block-row .list-story").each(function () {
            while ($(this)[0].scrollHeight > $(this).outerHeight()) {
                $(this).children("p").text(function (index, text) {
                    return text.replace(/\s+\S*\.*$/, "...");
                });
            }
        });
    }

});
