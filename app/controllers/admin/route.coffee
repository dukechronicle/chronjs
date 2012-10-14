admin = require './index'

exports.init = (app) ->
  app.get('/', admin.main.index)
  app.get('/article/new', admin.article.new)
  app.post('/article', admin.article.create)
