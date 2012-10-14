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
