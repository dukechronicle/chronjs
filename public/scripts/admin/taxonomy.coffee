define ['jquery', 'lib/jquery.chained'], ($) ->

  'select[data-chain]': ->
    $(this).each ->
      $(this).chained('#' + $(this).data('chain'))
