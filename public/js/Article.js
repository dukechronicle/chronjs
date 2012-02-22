define(["order!jquery", "order!underscore", "order!backbone"], function ($) {
    
    return Backbone.Model.extend({

        defaults: {
            type: "article"
        },

        addImageVersions: function (originalId, versionIds, imageTypes) {
            if (! _.isArray(versionIds))
                versionIds = [versionIds];
            if (! _.isArray(imageTypes))
                imageTypes = [imageTypes];
            
            var images = this.get("images") || {};
            for (var i = 0; i < imageTypes.length; i++)
                images[imageTypes[i]] = versionIds[i];
            images["Original"] = originalId;
            this.set({images: images});
        }

    });

});