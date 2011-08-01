$(function() {
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
        var groupName = $(this).data("groupname");
        var nameSpace = ["Layouts", "Frontpage"];

        var element = $("#" + docId);

        var containerElement = element.clone();
        containerElement.appendTo($(this));

        element.addClass("exists");
        element.attr("draggable", false);
        //$(this).append(element.get(0));
        
        $.post("/admin/group/add", {docId: docId, groupName: groupName, nameSpace: nameSpace, weight: 0});
        
        $(this).removeClass("over");
    });

    $("#layout").delegate(".story", "drop", function(e) {
        if (e.stopPropagation) e.stopPropagation();

        var docId = e.dataTransfer.getData("Text");
        var groupName = $(this).data("groupname");
        var nameSpace = ["Layouts", "Frontpage"];

        var element = $("#" + docId);

        element.addClass("exists");
        element.insertBefore($(this));
       // $(this).append(element.get(0));
        console.log(groupName);
       // $.post("/admin/group/add", {docId: docId, groupName: groupName, nameSpace: nameSpace, weight: 0});

        $(this).removeClass("over");
    });

    $("body").delegate(".story", "dragstart", function(e) {
        e.dataTransfer.setData("Text", this.id);
        console.log("dragstart"); 
    });


});

