define ['jquery', 'lib/underscore', 'lib/jquery-ui'], ($) ->

  loadAfterTypekit = (callback) ->
    ->
      execute = () => callback.call(this)
      if $('html').hasClass('wf-active') or $('html').hasClass('wf-inactive')
        execute()
      else
        setTimeout(execute, 300)

  pageAlign = ->
    # Iterate through groups in reverse order so nested groups get aligned first
    groups = $(this).get().reverse()
    $(groups).each ->
      # Align inner elements first
      elements = $(this).children('.align-element')
      primary = _.max(elements, (element) ->
        if $(element).data('alignprimary')
          Infinity
        else
          $(element).height()
      )

      for element in elements
        selector = $(element).data('aligntarget')
        target = if selector then $(element).find(selector) else element
        delta = $(primary).height() - $(element).height()
        $(target).height((index, height) -> height + delta)

    truncateStoryList()  # In case any story lists boxes were made smaller

  verticalAlign = ->
    extra = 10
    $(this).each ->
      height = $(this).width()
      $(this).css('left', -height + extra + 'px')
      $(this).css('visibility', 'visible')

      rounded = $(this).parent().siblings('.rounded')
      if rounded and rounded.height() < height
        rounded.css('min-height', height + 'px')

  truncateStoryList = ->
    $('.story-list .rounded').each ->
      # check for overflow, the +1 is a hack for IE. Oh IE...
      while $(this)[0].scrollHeight > $(this).outerHeight() + 1
        $(this).find('.list-story:last').remove()

  truncateTeaser = ->
    $(this).each ->
      while $(this)[0].scrollHeight > $(this).outerHeight() + 1
        $text = $(this).find('p:last')
        if $text.length > 0
          $text.text((index, text) -> text.replace(/\s+\S*\.*$/, '...'))
        else
          break

  displayDate = ->
    date = $.datepicker.formatDate('DD, MM d, yy', new Date)
    $(this).text(date)


  '.align-group': loadAfterTypekit(pageAlign),
  '.row .row-story': loadAfterTypekit(truncateTeaser),
  '.block .rounded': loadAfterTypekit(truncateTeaser),
  '.vertical-container .vertical': loadAfterTypekit(verticalAlign),
  'header .date': displayDate,
