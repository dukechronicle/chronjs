define ['jquery', 'lib/jquery.metadata', 'lib/jquery.openxtag'], ($) ->

  '.openx-ad': ->
    $.openxtag('init',
        delivery: 'http://www.oncampusweb.com/delivery'
        deliverySSL: 'https://www.oncampusweb.com/delivery'
    )
    $(this).openxtag('spc', -1)
