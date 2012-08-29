define ['jquery'], ($) ->
  (_main, modules...) ->
    $ ->
      for module in modules
        for selector, action of module
          if not selector or $(selector).length > 0
            action.call $(selector)