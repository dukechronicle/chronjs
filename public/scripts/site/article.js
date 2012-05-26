define(['jquery', 'disqus'], function ($, disqus) {

    return {

        "#disqus_thread": function() {
            var data = $("#disqus_thread").data('disqus');
            disqus.loadForArticle(data.production, data.shortname, data.id,
                                  data.title.replace(/'/g,"\\'"), data.url);
        }

    }

});
