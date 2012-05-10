define(['jquery', 'disqus'], function ($, disqus) {

    return {

        "#disqus_thread": function() {
            var data = $("#disqus_thread").data('disqus');
            disqus.loadForArticle(data.production, data.shortname, data.id,
                                  data.title.replace(/'/g,"\\'"), data.url);
            disqus.addCallback(appendCommentCount);
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