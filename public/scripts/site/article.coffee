define ['jquery', 'common/disqus'], ($, disqus) ->

  '#disqus_thread': ->
    data = $('#disqus_thread').data('disqus')
    disqus.loadForArticle(data.production, data.shortname, data.id,
                          data.title.replace("'", "\\'"), data.url)
