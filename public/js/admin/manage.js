define(['jquery', 'jquery-ui'], function ($) {

    $(function() {

        $(".delete").click(function(event) {
            event.preventDefault();

            var anchor = $(event.target);
            var title = anchor.attr('data-title');
            var docId = anchor.attr('data-docId');
            var docRev = anchor.attr('data-docRev');

            $('<div id="dialog-confirm">Delete <strong>' + title + '?</strong></div>').appendTo('body');

            $("#dialog-confirm").dialog({
                dialogClass: 'delete-confirmation-dialog',
                title: 'Delete Article',
                resizable: false,
                autoOpen: true,
                height:140,
                modal: true,
                buttons: {
                    Delete: function() {
                        $.ajax({
                            type: 'DELETE',
                            url: '/api/article/' + docId,
                            data: 'rev=' + docRev,
                            success: function() {
                                $(this).remove();
                                location.reload();
                            }
                        });
                    },
                    Cancel: function() {
                        $(this).remove();
                    }
                }
            });

        });
    });

});