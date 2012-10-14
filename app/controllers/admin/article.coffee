api = require '../../../thechronicle_modules/api'

errs = require 'errs'

Article = require '../../models/article'


exports.new = (req, res, next) ->
  res.render 'admin/article/new'
    taxonomy: api.taxonomy.levels()

createArticle = (doc, callback) ->
  article = new Article(doc)
  console.log(Article.prototype.save)
  console.log(article.save)
  article.save(callback)

exports.create = (req, res, next) ->
  createArticle req.body.doc, (err, retryErrors) ->
    if err then return next(err)
    res.redirect('/')
