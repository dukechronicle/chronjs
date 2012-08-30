define ['order!jquery', 'order!lib/underscore', 'order!lib/backbone'], ($) ->

  Backbone.Model.extend
    urlRoot: '/api/page',
    idAttribute: '_id',
