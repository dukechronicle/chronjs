$(function() {

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
        console.log("dragover");
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
        $.post("/api/group/remove", {
            docId: $(this).attr("id"),
            groupName: $(this).parent().data("groupname"),
            nameSpace: nameSpace
        });
        $(this).remove();
    });

    $("#layout").delegate(".container", "drop", function(e) {

        if (e.stopPropagation) e.stopPropagation();

        var docId = e.dataTransfer.getData("Text");

	    console.log("dropping " + docId);

        var element = $("#" + docId);

        var containerElement = element.clone();
        containerElement.appendTo($(this));

        element.addClass("exists");
        //element.attr("draggable", false);
        //$(this).append(element.get(0));

        if (false && element.parent().data("groupname") && (element.parent().data("groupname") !== $(this).data("groupname"))) {
            removeFromPrevious(docId, element, $(this).data("groupname"), containerElement);
        } else {
            $.post("/api/group/add", {
                docId: docId,
                groupName: $(this).data("groupname"),
                nameSpace: nameSpace,
                weight: containerElement.index()
            });
        }
        
        $(this).removeClass("over");
    });

    $("#layout").delegate(".story", "drop", function(e) {
        if (e.stopPropagation) e.stopPropagation();
        var _this = this;
        var docId = e.dataTransfer.getData("Text");
        var element = $("#" + docId);
        var newElement = element.clone();
        var nextSibling;
        
        newElement.insertBefore($(this));

        // story has changed groups
        if (element.parent().data("groupname") && (element.parent().data("groupname") !== $(this).parent().data("groupname"))) {
            removeFromPrevious(docId, element, $(_this).parent().data("groupname"), newElement);
        } else {
            element.remove();
            $.post("/api/group/add", {
                docId: docId,
                groupName: $(this).parent().data("groupname"),
                nameSpace: nameSpace,
                weight: newElement.index()
            });
        }

        nextSibling = newElement;
        while ((nextSibling = nextSibling.next()) && (nextSibling.length > 0)) {

            $.post("/api/group/add", {
                docId: nextSibling.attr("id"),
                groupName: $(this).parent().data("groupname"),
                nameSpace: nameSpace,
                weight: nextSibling.index()
            });
        }

        $(this).removeClass("over");
    });

    $("body").delegate(".story", "dragstart", function(e) {
        e.dataTransfer.setData("Text", this.id);
    });

    function removeFromPrevious(docId, element, newGroupName, newElement) {
        var oldElementParent = element.parent();
            nextSibling = element.next();

            $.post("/api/group/remove", {
                docId: element.attr("id"),
                groupName: oldElementParent.data("groupname"),
                nameSpace: nameSpace
            }, function() {
                $.post("/api/group/add", {
                docId: docId,
                groupName: newGroupName,
                nameSpace: nameSpace,
                weight: newElement.index()
            });
            });
            element.remove();

            if (nextSibling.length>0) {
                do {
                    $.post("/api/group/add", {
                        docId: nextSibling.attr("id"),
                        groupName: oldElementParent.data("groupname"),
                        nameSpace: nameSpace,
                        weight: nextSibling.index()
                    });
                } while ((nextSibling = nextSibling.next()) && (nextSibling.length > 0));
            }
    }
});

