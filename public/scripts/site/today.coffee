define ['jquery', 'lib/date.format'], ($) ->

  '.local-time': ->
    $(this).each ->
      date = $(this).data('date')
      date = if date then new Date(date) else Date.now()
      $(this).text dateFormat(date, $(this).data('format'))