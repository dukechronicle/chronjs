define ['jquery', 'lib/jquery.metadata', 'lib/jquery.openxtag'], ($) ->

  '.openx-ad': ->
    $.openxtag('init', {delivery: '/xhrproxy/openx'})
    $(this).openxtag('spc', -1)
