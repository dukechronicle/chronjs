api = require '../../../thechronicle_modules/api'

Article = require '../../models/article'


exports.new = (req, res, next) ->
  res.render 'admin/article/new'
    taxonomy: api.taxonomy.levels()
