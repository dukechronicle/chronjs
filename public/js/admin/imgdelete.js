var imageDelete;

define(['jquery', 'libs/jquery-ui'], function ($) {

    imageDelete = function() {

        $(".delete-image").click(function(event) {
            event.preventDefault();

            var anchor = $(event.target);
            var params = {};
            params.id = anchor.attr('data-id');
            params.orig = anchor.attr('data-orig');
            
            $.getJSON(
                '/admin/image/articles',
                params,
                function(data) {
                    
                    var msg = '<div id="dialog-confirm">This image will be removed from the following articles:<ul>';
                    $.each(data, function(index, value) {
                        msg += '<li>' + value.title || 'Non-article object' + '</li>';
                    });
                    msg += '</ul></div>';
                    
                    $(msg).appendTo('body');

                    $("#dialog-confirm").dialog({
                        dialogClass: 'delete-confirmation-dialog',
                        title: 'Delete Image',
                        resizable: false,
                        autoOpen: true,
                        height:140,
                        modal: true,
                        buttons: {
                            "Delete": function() {
                                $.getJSON(
                                    '/admin/image/delete',
                                    params,
                                    function(data) {
                                        location.reload();
                                    }
                                );
                            },
                            Cancel: function() {
                                $(this).remove();
                            }
                        }
                    });
                }
            );
        });
    };

});