errs = require 'errs'

config = require 'thechronicle_modules/config'

Article = require 'app/models/article'
controllers = require 'app/controllers'


describe 'article', ->
  req = res = next = undefined

  before (done) ->
    func = () -> undefined
    config.init(func, done)

  beforeEach ->
    req =
      session:
        _csrf: 'csrf token'
    res = {render: sinon.spy()}
    next = sinon.spy()

  describe 'new', ->
    it 'should render the new article template with taxonomy', ->
      controllers.admin.article.new(req, res, next)
      res.render.should.have.been.calledWith 'admin/article/new'

  describe 'create', ->
    it 'should call save on a new article', (done) ->
      sinon.stub(Article.prototype, 'save').yields()
      req.body = {doc: {}}
      res.render = res.redirect = next = ->
        Article.prototype.save.should.have.been.called
        Article.prototype.save.restore()
        done()
      controllers.admin.article.create(req, res, next)

    it 'should not save article if it is invalid', (done) ->
      sinon.stub(Article.prototype, 'save').yields()
      sinon.stub(Article.prototype, 'validate')
        .yields(errs.create('ValidationError'))
      res.render = res.redirect = next = ->
        Article.prototype.save.should.not.have.been.called
        Article.prototype.save.restore()
        Article.prototype.validate.restore()
        done()
      controllers.admin.article.create(req, res, next)

    it 'should render errors to view if article is invalid', (done) ->
      error = {oh: 'no'}
      sinon.stub(Article.prototype, 'validate')
        .yields(errs.create('ValidationError',
          errors: error,
        ))
      res.render = (view, locals) ->
        view.should.equal 'admin/article/new'
        locals.errors.should.equal error
        Article.prototype.validate.restore()
