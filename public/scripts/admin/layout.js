define(['jquery', 'common/article'], function($, Article) {

    var articles = {};
    var updated = [];
    var selectedArticle;
    var upperAsciiStart = 65;
    var lowerAsciiStart = 97;
    var caseConversion = 32;
    var namespace;

    return { "#layout": initLayout }


    function initLayout () {

        namespace = $("#groups").data('namespace');

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

        $("#groups").delegate(".container, .story", "dragover", function(e) {
            if (e.preventDefault) e.preventDefault(); // Allows us to drop.
            e.dataTransfer.dropEffect = "move";
            $(this).addClass("over");
            return false;
        });

        $("#groups").delegate(".container, .story", "dragenter", function () {
            $(this).addClass("over");
        });

        $("#groups").delegate(".container, .story", "dragleave", function() {
            $(this).removeClass("over");
        });

        // mark on single click
        $("#container").delegate(".story", "click", function() {
            var id = $(this).attr('id');
            $('.story').removeClass("ui-state-highlight");
            $(this).addClass("ui-state-highlight");
            selectedArticle = $(this);
            showHotkeys();

        });

        // remove on double click
        $("#groups").delegate(".story", "dblclick", function() {
            var id = $(this).attr('id');
            removeStoryFromContainer($(this), $(this).parent());
            $("#" + id).removeClass("exists");
        });

        $("#groups").delegate(".container", "drop", function(e) {
            if (e.stopPropagation) e.stopPropagation();

            var docId = e.dataTransfer.getData("Text");
            var original = $("#" + docId);
            var element = original.addClass("exists").clone();

            if (element.parent().data("groupname"))
                removeStoryFromContainer(element, element.parent());

            if (original.parent().attr('id') != "stories")
                removeStoryFromContainer(original, original.parent());

            element.appendTo($(this));
            addStoryToContainer(element, $(this));

            $(this).removeClass("over");
        });

        $("#groups").delegate(".story", "drop", function(e) {
            if (e.stopPropagation) e.stopPropagation();

            var docId = e.dataTransfer.getData("Text");
            var original = $("#" + docId);
            var element = original.addClass("exists").clone();
            element.addClass("exists");

            if (element.parent().data("groupname"))
                removeStoryFromContainer(element, element.parent());

            if (original.parent().attr('id') != "stories")
                removeStoryFromContainer(original, original.parent());
            
            element.insertBefore($(this));
            addStoryToContainer(element, $(this).parent());

            $(this).removeClass("over");
        });

        $("body").delegate(".story", "dragstart", function(e) {
            e.dataTransfer.setData("Text", this.id);
        });

        // If an article is selected, copt it to the 
        // container that corresponds with the key pressed
        $('body').bind('keypress', function(e) {
            if (!selectedArticle) return;
            var code = e.keyCode || e.which;
            $(".hotkey").each(function(index) {
                // If the keypress is lowercase, subtract
                // 32 from the ascii value to convert it to uppercase
                if (lowerAsciiStart+index == code) code -= caseConversion;
                if (upperAsciiStart+index == code)
                {   
                    selectedArticle.removeClass("ui-state-highlight");
                    $(".hotkey").fadeOut();
                    var element = selectedArticle.addClass("exists").clone();
                    element.addClass("exists");
                    var container = $('div[keycode='+code+']')
                    element.appendTo(container);
                    addStoryToContainer(element, container);
                    selectedArticle = null;

                }
            });
        });

    }

    function addStoryToContainer(story, container) {
        var groupname = container.data("groupname");
        var weight = container.children().index(story) + 1;
        articles[story.attr('id')].addGroup(namespace,groupname,weight);
        updated.push(story.attr('id'));
        if (story.next().length > 0)
            addStoryToContainer(story.next(), container);

    }

    function removeStoryFromContainer(story, container) {
        var groupname = container.data("groupname");
        articles[story.attr('id')].removeGroup(namespace, groupname);
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
            if ($("#groups").find("#" + $(this).attr('id')).length > 0)
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

    function showHotkeys(){
        $(".hotkey").each(function(index) {
            var group = $(this).attr('group');
            var mapping = $('div[data-groupname="'+group+'"]');
            var pos = mapping.position();
            var height = mapping.outerHeight();
            var width = mapping.outerWidth();
            $(this).css({
                position: "absolute",
                top: pos.top + height/2 - $(this).innerHeight()/2 + "px",
                left: (pos.left + width + 50) + "px"
            }).fadeIn();
        });
    }

});
