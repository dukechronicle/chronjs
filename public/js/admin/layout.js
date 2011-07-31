$(function() {
    // http://weblog.bocoup.com/using-datatransfer-with-jquery-events
    jQuery.event.props.push('dataTransfer'); // solves dataTransfer undefined issue

    $("#layout").delegate(".container", "dragover", function(e) {
        console.log("dragover");
        if (e.preventDefault) e.preventDefault(); // Allows us to drop.
        e.dataTransfer.dropEffect = "move";
        $(this).addClass("over");
        return false;
    });

    $("#layout").delegate(".container", "dragenter", function(e) {
        $(this).addClass("over");
    });

    $("#layout").delegate(".container", "dragleave", function(e) {
        $(this).removeClass("over");
    });

    $("#layout").delegate(".container", "drop", function(e) {
        if (e.stopPropagation) e.stopPropagation();


        var docId = e.dataTransfer.getData("Text");
        var groupName = $(this).data("groupname");
        var nameSpace = ["Layouts", "Frontpage"];

        var element = $("#" + docId);

        element.addClass("exists");
        $(this).append(element.get(0));
        console.log(groupName);
        $.post("/admin/group/add", {docId: docId, groupName: groupName, nameSpace: nameSpace, weight: 0});
        
        $(this).removeClass("over");
    });

    $("body").delegate(".story", "dragstart", function(e) {
        e.dataTransfer.setData("Text", this.id);
        console.log("dragstart"); 
    });
});

