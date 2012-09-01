define ['jquery', 'lib/date.format'], ($) ->

  pluralize = (word, quantity) ->
    "#{quantity} #{word}" + (if quantity is 1 then '' else 's')

  timeText = (milliseconds) ->
    seconds = Math.floor(milliseconds / 1000)
    minutes = Math.floor(seconds / 60)
    hours = Math.floor(minutes / 60)
    days = Math.floor(hours / 24)

    hours = hours % 24
    minutes = minutes % 60
    "#{pluralize('day', days)}, #{pluralize('hour', hours)}, #{pluralize('minute', minutes)}"

  displayRemainingTime = ($element, milliseconds) ->
    $element.children('.label').text('Starts in')
    $element.children('.value').text(timeText(milliseconds))

  updateGameStats = ($element, startTime) ->
    ->
      milliseconds = startTime - Date.now()
      if milliseconds > 0
        displayRemainingTime($element, milliseconds)
      else
        displayGameScore($element)

  '.game-stats': ->
    startTime = new Date($(this).data('starttime'))
    setInterval(updateGameStats($(this), startTime), 5000)
    $(this).show()
  '.local-time': ->
    date = new Date($(this).data('date'))
    $(this).text(dateFormat(date, $(this).data('format')))
