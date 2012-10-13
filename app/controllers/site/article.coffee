Article = require '../../models/article'


exports.show = (req, res, next) ->
  url = req.params.url
  Article.findOne({url: req.params.url}, (err, article) ->
    if err
      next(err)
    else if not article?
      next()
    else
      res.render 'site/pages/article',
        doc: article
        pageTitle: article.title
        section: article.taxonomy[0],
  )
