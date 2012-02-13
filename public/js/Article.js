define(["order!jquery", "order!underscore", "order!Backbone"], function ($) {
    
    return Backbone.Model.extend({

        defaults: {
            type: "article"
        }

    });

});