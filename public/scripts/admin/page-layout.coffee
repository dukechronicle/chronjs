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

  savePage = (e) ->
    e.preventDefault()
    try
      view.storeData()
    catch err
      return alert('Please fix errors with page model')
    for input in $(this).serializeArray()
      page.set(input.name, input.value)

    $(this).find('button').attr('disabled', true)
    page.save(
      complete: (data) ->
        console.log data
      success: (data) =>
        console.log 'success'
        console.log data
        $(this).find('button').attr('disabled', undefined)
      error: (err) =>
        $(this).find('button').attr('disabled', undefined)
        alert(err)
    )

  '#page-layout': ->
    model = $(this).find('.groups').data('model')
    page = new Page(model: model)

    $('#template').change ->
      loadTemplate $(this).val()
    if $('#template').val()
      loadTemplate $('#template').val()

    $('form#settings').submit(savePage)