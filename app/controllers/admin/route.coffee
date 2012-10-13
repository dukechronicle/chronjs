admin = require './index'

exports.init = (app) ->
  app.get('/article/new', admin.article.new)
  app.post('/article', admin.article.create)
