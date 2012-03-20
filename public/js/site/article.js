define(['jquery', 'disqus'], function ($) {

    $(function() {
        var params = $("#disqus_thread").data('disqus');
        if (params) {
            loadDisqusForArticle(params.isProduction, params.shortname,
                                 params.id, params.title, params.url);
        }
    });

    disqus_config = function () {
        this.callbacks.afterRender = [function() {
            appendCommentCount();
        }];
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