$(function() {

	$("#taxonomy").change(function() {
		var section = $(this).attr('value');
		var plainUrl = $(location).attr('href').split("?")[0];
		$("#stories-container").load(plainUrl + "?section=" + section + " #stories");

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

    $("#layout").delegate(".container, .story", "dragenter", function(e) {
        $(this).addClass("over");
    });

    $("#layout").delegate(".container, .story", "dragleave", function(e) {
        $(this).removeClass("over");
    });

    // remove on double click
    $("#layout").delegate(".story", "dblclick", function(e) {
        $.post("/admin/group/remove", {
            docId: $(this).attr("id"),
            groupName: $(this).parent().data("groupname"),
            nameSpace: ["Layouts", "Frontpage"]
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
        element.attr("draggable", false);
        //$(this).append(element.get(0));

        if (element.parent().data("groupname") && (element.parent().data("groupname") !== $(this).data("groupname"))) {
            removeFromPrevious(docId, element, $(this).data("groupname"), containerElement);
        } else {
            $.post("/admin/group/add", {
                docId: docId,
                groupName: $(this).data("groupname"),
                nameSpace: ["Layouts", "Frontpage"],
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

            $.post("/admin/group/add", {
                docId: docId,
                groupName: $(this).parent().data("groupname"),
                nameSpace: ["Layouts", "Frontpage"],
                weight: newElement.index()
            });
        }

        nextSibling = newElement;
        while ((nextSibling = nextSibling.next()) && (nextSibling.length > 0)) {

            $.post("/admin/group/add", {
                docId: nextSibling.attr("id"),
                groupName: $(this).parent().data("groupname"),
                nameSpace: ["Layouts", "Frontpage"],
                weight: nextSibling.index()
            });
        }

        $(this).removeClass("over");
    });

    $("body").delegate(".story", "dragstart", function(e) {
        e.dataTransfer.setData("Text", this.id);
        console.log("dragstart"); 
    });

    function removeFromPrevious(docId, element, newGroupName, newElement) {
        var oldElementParent = element.parent();
            nextSibling = element.next();

            $.post("/admin/group/remove", {
                docId: element.attr("id"),
                groupName: oldElementParent.data("groupname"),
                nameSpace: ["Layouts", "Frontpage"]
            }, function() {
                $.post("/admin/group/add", {
                docId: docId,
                groupName: newGroupName,
                nameSpace: ["Layouts", "Frontpage"],
                weight: newElement.index()
            });
            });
            element.remove();

            if (nextSibling.length>0) {
                do {
                    $.post("/admin/group/add", {
                        docId: nextSibling.attr("id"),
                        groupName: oldElementParent.data("groupname"),
                        nameSpace: ["Layouts", "Frontpage"],
                        weight: nextSibling.index()
                    });
                } while ((nextSibling = nextSibling.next()) && (nextSibling.length > 0));
            }
    }
});

