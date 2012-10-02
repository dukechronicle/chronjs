define ['jquery', 'lib/jquery.metadata', 'lib/jquery.openxtag'], ($) ->

  '.openx-ad': ->
    $.openxtag('init',
        block: true
        delivery: 'http://www.oncampusweb.com/delivery'
        deliverySSL: 'https://www.oncampusweb.com/delivery'
    )
    $(this).openxtag('spc', -1)
