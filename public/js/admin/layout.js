define(['jquery', 'Article'], function($, Article) {

    var articles = new Backbone.Collection;


    $(function() {
        
        $(".story").each(function () {
            $(this).attr("draggable", "true");

            var id = $(this).attr('id');
            var groups = $(this).data('groups') || [];

            if (articles.get(id) == undefined)
                articles.add(new Article({
                    id: $(this).attr('id'),
                    groups: groups
                }));
        });

	$("#taxonomy").change(function() {
	    var section = $(this).attr('value');
	    var plainUrl = $(location).attr('href').split("?")[0];

	    if(section != 'All') $("#stories-container").load(plainUrl + "?section=" + section + " #stories");
            else $("#stories-container").load(plainUrl + " #stories");
	});

	/*
	 * Bindings for drag and drop
	 */
        // http://weblog.bocoup.com/using-datatransfer-with-jquery-events
        jQuery.event.props.push('dataTransfer'); // solves dataTransfer undefined issue

        $("#layout").delegate(".container, .story", "dragover", function(e) {
            if (e.preventDefault) e.preventDefault(); // Allows us to drop.
            e.dataTransfer.dropEffect = "move";
            $(this).addClass("over");
            return false;
        });

        $("#layout").delegate(".container, .story", "dragenter", function () {
            $(this).addClass("over");
        });

        $("#layout").delegate(".container, .story", "dragleave", function() {
            $(this).removeClass("over");
        });

        // remove on double click
        $("#layout").delegate(".story", "dblclick", function() {
            removeStoryFromContainer($(this), $(this).parent());
        });

        $("#layout").delegate(".container", "drop", function(e) {
            if (e.stopPropagation) e.stopPropagation();

            var docId = e.dataTransfer.getData("Text");
            var element = $("#" + docId);
            element.addClass("exists");

            if (element.parent().data("groupname"))
                removeStoryFromContainer(element, element.parent());

            element.appendTo($(this));
            addStoryToContainer(element, $(this));

            $(this).removeClass("over");
        });

        $("#layout").delegate(".story", "drop", function(e) {
            if (e.stopPropagation) e.stopPropagation();

            var docId = e.dataTransfer.getData("Text");
            var element = $("#" + docId);
            element.addClass("exists");

            if (element.parent().data("groupname"))
                removeStoryFromContainer(element, element.parent());

            element.insertBefore($(this));
            addStoryToContainer(element, $(this).parent());

            $(this).removeClass("over");
        });

        $("body").delegate(".story", "dragstart", function(e) {
            e.dataTransfer.setData("Text", this.id);
        });

        function addStoryToContainer(story, container) {
            var groupname = container.data("groupname");
            var weight = container.index(story);
            articles.get(story.attr('id')).addGroup(NAMESPACE,groupname,weight);
            if (story.next().length > 0)
                addStoryToContainer(story.next(), container);
        }

        function removeStoryFromContainer(story, container) {
            var groupname = container.data("groupname");
            articles.get(story.attr('id')).removeGroup(NAMESPACE, groupname);
            if (story.next().length > 0) {
                var next = story.next();
                story.remove();
                addStoryToContainer(next, container);
            }
            else {
                story.remove();
            }
        }

    });

});

