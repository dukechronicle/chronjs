define ['jquery', 'lib/date.format'], ($) ->

  pluralize = (word, quantity) ->
    "#{quantity} #{word}" + (if quantity is 1 then '' else 's')

  displayRemainingTime = ($element, endtime) ->
    ->
      milliseconds = endtime - Date.now()
      seconds = Math.floor(milliseconds / 1000)
      minutes = Math.floor(seconds / 60)
      hours = Math.floor(minutes / 60)
      days = Math.floor(hours / 24)

      hours = hours % 24
      minutes = minutes % 60
      $element.text("#{pluralize('day', days)}, #{pluralize('hour', hours)}, #{pluralize('minute', minutes)}")

  '.countdown': ->
    endtime = new Date($(this).data('endtime'))
    setInterval(displayRemainingTime($(this), endtime), 1000)
    $(this).parent().show()
  '.current-time': ->
    date = new Date($(this.data('date')))
    $(this).text(dateformat(date, $(this).data('format')))
