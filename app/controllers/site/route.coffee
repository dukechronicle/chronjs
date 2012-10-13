site = require './index'

exports.init = (app) ->
  app.get('/article/:url', site.article.show)
