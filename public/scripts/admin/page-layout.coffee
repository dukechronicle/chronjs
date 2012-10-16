define ['jquery', 'cs!common/page', 'cs!common/views/group'], ($, Page, Group) ->

  page = undefined
  views = []


  loadTemplate = (templateName) ->
    fetchTemplate(templateName, (template) ->
      view.remove() for view in views
      views = [new Group(template)]
      renderViews(views)
    )

  renderViews = (views) ->
    for view, i in views
      view.render(i)
      $('.groups').append(view.el)
    # for view, i in views
    #   if i % 2 == 0
    #     view.render(i)
    #     $('.groups .left-col').append(view.el);
    #   else
    #     view.render(i)
    #     $('.groups .right-col').append(view.el);

  fetchTemplate = (template, callback) ->
    $.get("/api/template/#{template}", callback);

  '#page-layout': ->
    page = new Page
    $('#template').change ->
      loadTemplate $(this).val()