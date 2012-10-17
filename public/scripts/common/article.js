define(["jquery", "lib/backbone"], function ($, Backbone) {

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
        },

        addGroup: function (namespace, group, weight) {
            this.removeGroup(namespace, group);
            var groups = this.get("groups") || [];
        groups.push([namespace, group, weight]);
            this.set({groups: groups});
        },

        removeGroup: function (namespace, group) {
            var groups = this.get("groups") || [];
            groups = _.reject(groups, function (entry) {
        return entry[0].toString() == namespace.toString() &&
                    entry[1] == group;
            });
            this.set({groups: groups});
        }

    });

});