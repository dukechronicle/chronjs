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

  fetchGameScore = (selector, callback) ->
    $.ajax('/xhrproxy/espn',
      cache: false,
      error: (jqXHR, status) -> callback(status)
      success: (data) ->
        cell = $(data).find("#showschedule #{selector} td:eq(2)")
        if cell.length
          callback(null, cell.text())
        else
          callback("Can't fetch score")
    )

  displayRemainingTime = ($element, milliseconds) ->
    $element.children('.label').text('Starts In')
    $element.children('.value').text(timeText(milliseconds))

  displayGameScore = ($element) ->
    $element.children('.label').text('Game Score')
    fetchGameScore($element.data('selector'), (err, data) ->
      if not err?
        $element.children('.value').text(data)
    )

  updateGameStats = ($element, startTime) ->
    ->
      milliseconds = startTime - Date.now()
      if milliseconds > 0
        displayRemainingTime($element, milliseconds)
      else
        displayGameScore($element)

  '.game-stats': ->
    startTime = new Date($(this).data('starttime'))
    update = updateGameStats($(this), startTime)
    update()
    setInterval(update, 10000)
    $(this).show()
  '.local-time': ->
    $(this).each ->
      date = new Date($(this).data('date'))
      $(this).text(dateFormat(date, $(this).data('format')))
