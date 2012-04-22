var configureAppendCommentCount;

define(['jquery', 'disqus'], function ($) {

    return configureAppendCommentCount = function() {
        disqus_config = function () {
            this.callbacks.afterRender = [function() {
                appendCommentCount();
            }];
        }
    }

    function appendCommentCount() {
        var count = $("#dsq-num-posts").html();

        if($("#dsq-total-posts").html() != null) {
            count = $("#dsq-total-posts").html();
        }

        var newText = $("#commentLink").html() + " ("+count+")";
        $("#commentLink").html(newText);
    }

});