Article = require 'app/models/article'

SUCCESS_CODE = 200


describe 'article', ->
  before (done) ->
    server.run(done)

  describe '/article/new', ->
    browser = undefined

    beforeEach (done) ->
      url = fullUrl('admin', '/article/new')
      Browser.visit url, {runScripts: false}, (err, _browser) ->
        browser = _browser
        done(err)

    it 'should successfully load page', ->
      browser.statusCode.should.equal SUCCESS_CODE

    it 'should have form posting to /article', ->
      form = browser.query('form')
      expect(form).to.exist
      form.getAttribute('method').should.equal 'POST'
      form.getAttribute('action').should.equal '/article'

    it 'should create a new article when form is submitted', (done) ->
      sinon.stub(Article.prototype, 'save').yields()
      browser
        .fill('Title', 'Ash defeats Gary in Indigo Plateau')
        .fill('Subtitle', 'Oak arrives just in time')
        .fill('Teaser', 'Ash becomes new Pokemon Champion')
        .fill('Body', '**Pikachu** wrecks everyone. The End.')
        .select('Section', 'News')
        .fill('Authors', 'Brock')
        .pressButton('Submit', () ->
          Article.prototype.save.should.have.been.called;
          article = User.prototype.save.thisValues[0];
          article.title.should.equal('Ash defeats Gary in Indigo Plateau')
          article.subtitle.should.equal('Oak arrives just in time')
          article.teaser.should.equal('Ash becomes new Pokemon Champion')
          article.body.should.equal('**Pikachu** wrecks everyone. The End.')
          article.taxonomy.should.deep.equal(['News'])
          article.authors.should.equal('Brock')
          Article.prototype.save.restore()
          done()
        )
