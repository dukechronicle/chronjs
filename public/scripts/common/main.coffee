define ['jquery'], ($) ->
  ->
    args = Array.prototype.slice.call(arguments, 1)
    $ ->
      for module in args
        for selector, action of module
          if not selector or $(selector).length > 0
            action.call(selector)