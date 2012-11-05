define ['jquery'], ($) ->

  scrollLoop = ->
    $('.subnav').stop().animate({left:'-=20'}, 100, 'linear', scrollLoop)

  stop = ->
    $('.subnav').stop()

  '.scroll-caret': ->
    $(this).hover(scrollLoop, stop)