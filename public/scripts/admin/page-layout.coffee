define ['jquery', 'cs!common/page', 'cs!common/views/group'], ($, Page, Group) ->

  page = undefined


  loadTemplate = (templateName) ->
    fetchTemplate(templateName,
      success: (template) ->
        views = (new Group(property, schema) for property, schema of template)
        renderViews(views)
    )

  renderViews = (views) ->
    for view, i in views
      if i % 2 == 0
        view.render(i)
        $('.groups .left-col').append(view.el);
      else
        view.render(i)
        $('.groups .right-col').append(view.el);

  fetchTemplate = (template, options) ->
    options.success(
      contents:
        name: 'Body Contents',
      stuff:
        name: 'Other Stuff',
    )

  '#page-layout': ->
    page = new Page
    $('#template').change ->
      console.log 'loading'
      loadTemplate $(this).val()