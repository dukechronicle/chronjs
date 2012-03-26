var layout;

define(['jquery', 'Article'], function($, Article) {

    var articles = {};
    var updated = [];


    layout = function() {

        initializeStories($(".story"));


        $("#save").click(function () {
            if (_.isEmpty(updated))
                alert("No updates make to layout");
            else {
                var button = $(this);
                button.attr('disabled', 'disabled');
                updated = _.uniq(updated);
                saveAll(function (err) {
	            if (err) alert(err);
		    button.removeAttr('disabled');
                });
            }
        });

	$("#taxonomy").change(function() {
	    var section = $(this).attr('value');
	    var url = $(location).attr('href').split("?")[0];
	    if (section != 'All')
                url += "?section=" + section;
            $("#stories-container").load(url + " #stories", function () {
                initializeStories($("#stories > .story"));
            });
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
            var id = $(this).attr('id');
            removeStoryFromContainer($(this), $(this).parent());
            $("#" + id).removeClass("exists");
        });

        $("#layout").delegate(".container", "drop", function(e) {
            if (e.stopPropagation) e.stopPropagation();

            var docId = e.dataTransfer.getData("Text");
            var element = $("#" + docId).addClass("exists").clone();

            if (element.parent().data("groupname"))
                removeStoryFromContainer(element, element.parent());

            element.appendTo($(this));
            addStoryToContainer(element, $(this));

            $(this).removeClass("over");
        });

        $("#layout").delegate(".story", "drop", function(e) {
            if (e.stopPropagation) e.stopPropagation();

            var docId = e.dataTransfer.getData("Text");
            var element = $("#" + docId).addClass("exists").clone();
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
            var weight = container.children().index(story) + 1;
            articles[story.attr('id')].addGroup(NAMESPACE,groupname,weight);
            updated.push(story.attr('id'));
            if (story.next().length > 0)
                addStoryToContainer(story.next(), container);
        }

        function removeStoryFromContainer(story, container) {
            var groupname = container.data("groupname");
            articles[story.attr('id')].removeGroup(NAMESPACE, groupname);
            updated.push(story.attr('id'));
            if (story.next().length > 0) {
                var next = story.next();
                story.remove();
                addStoryToContainer(next, container);
            }
            else {
                story.remove();
            }
        }

        function initializeStories(stories) {
            stories.each(function () {
                if ($("#layout").find("#" + $(this).attr('id')).length > 0)
                    $(this).addClass("exists");

                var id = $(this).attr('id');
                var groups = $(this).data('groups') || [];
                
                if (! (id in articles))
                    articles[id] = new Article({
                        id: $(this).attr('id'),
                        groups: groups
                    });
            });
        }

        function saveAll(callback) {
            var article = articles[updated.pop()];
            article.save(null, {
                url: '/api/article/' + article.get("id"),
                success: function(data, status, jqXHR) {
                    if (updated.length > 0) saveAll(callback);
                    else callback();
                },
                error: function (jqXHR, status, errorThrown) {
                    callback(status.responseText);
                }
            });
        }

    };

});
