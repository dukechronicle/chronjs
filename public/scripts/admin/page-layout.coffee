define ['jquery', 'cs!common/page', 'cs!common/views/page'], ($, Page, PageView) ->

  page = undefined
  view = undefined


  loadTemplate = (templateName) ->
    fetchTemplate(templateName, (template) ->
      view.remove() if view?
      view = new PageView(page, template)
      view.render()
      $('.groups').append(view.el)
    )

  fetchTemplate = (template, callback) ->
    $.get("/api/template/#{template}", callback);

  '#page-layout': ->
    model = $(this).find('groups').data('model')
    page = new Page(model: model and JSON.parse(model))
    $('#template').change ->
      loadTemplate $(this).val()
    $('form#settings').submit (e) ->
      e.preventDefault()
      try
        view.storeData()
        for input in $(this).serializeArray()
          page.set(input.name, input.value)
        console.log page.toJSON()
      catch err
        alert('Please fix errors with page model')


