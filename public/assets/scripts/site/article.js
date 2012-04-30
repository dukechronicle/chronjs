define(['jquery', 'disqus'], function ($) {

    return {
        article: function() {
            var data = $("#disqus_thread").data('disqus');
            loadDisqusForArticle(data.production, data.shortname, data.id,
                                 data.title.replace(/'/g,"\\'"), data.url);

            disqus_config = function () {
                this.callbacks.afterRender = [function() {
                    appendCommentCount();
                }];
            }
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