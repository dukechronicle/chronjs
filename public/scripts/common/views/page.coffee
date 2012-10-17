define ['jquery', 'lib/backbone'], ($, Backbone) ->

  Backbone.View.extend

    initialize: (@model, schema) ->
      @schema =
        type: 'object'
        properties: schema

    template: _.template($('#group-template').text());

    storeData: ->
      data = @ondeSession.getData()
      if data.errorCount > 0
        throw new Error(data.errorData)
      @model.set(model: data.data)

    render: () ->
      $(this.el).html(this.template())
      @ondeSession = new onde.Onde $(this.el).find('form')
      @ondeSession.render(@schema, @model.get('model'), {collapsedCollapsibles: true})
      this
