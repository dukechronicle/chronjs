define ['order!jquery', 'order!lib/underscore', 'order!lib/backbone'], ($) ->

  Backbone.View.extend

    initialize: (schema) ->
      @schema =
        type: 'object'
        properties: schema

    template: _.template($('#group-template').text());

    render: (index) ->
      label = "Model"
      label += " (#{String.fromCharCode(65 + index)})" if index?
      $(this.el).html(this.template(label: label))
      ondeSession = new onde.Onde $(this.el)
      ondeSession.render(@schema, null, {collapsedCollapsibles: true})
      this
