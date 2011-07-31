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

        var element = $("#" + e.dataTransfer.getData("Text"));

        element.addClass("exists");
        $(this).append(element.get(0));
        
        $(this).removeClass("over");
    });

    $("body").delegate(".story", "dragstart", function(e) {
        e.dataTransfer.setData("Text", this.id);
        console.log("dragstart"); 
    });
});

