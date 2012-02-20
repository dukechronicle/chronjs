define(["order!jquery", "order!underscore", "order!backbone"], function ($) {
    
    return Backbone.Model.extend({

        defaults: {
            type: "article"
        }

    });

});