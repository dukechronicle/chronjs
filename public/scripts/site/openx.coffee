define ['jquery', 'libs/jquery.metadata', 'libs/jquery.openxtag'], ($) ->

  '.openx-ad': ->
    $.openxtag('init', {delivery: '/xhrproxy/openx'})
    $('.openx-ad').openxtag('spc', -1)
