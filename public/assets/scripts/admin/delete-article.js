define(['jquery', 'libs/jquery-ui'], function ($) {

    return { "": deleteArticle }

    function deleteArticle() {

        $(".delete-article").click(function(event) {
            event.preventDefault();

            var anchor = $(event.target);
            var title = anchor.data('title');
            var docId = anchor.data('docid');
            var docRev = anchor.data('rev');
            var dest = anchor.data('dest');

            $('<div id="dialog-confirm">Delete <strong>' + title + '?</strong></div>').appendTo('body');

            $("#dialog-confirm").dialog({
                dialogClass: 'delete-confirmation-dialog',
                title: 'Delete Article',
                resizable: false,
                autoOpen: true,
                height:140,
                modal: true,
                buttons: {
                    "Delete": function() {

                        $.ajax({
                            type: 'DELETE',
                            url: '/api/article/' + docId,
                            data: 'rev=' + docRev,
                            success: function() {
                                window.location = dest;
                            }
                        });
                    },
                    Cancel: function() {
                        $(this).remove();
                    }
                }
            });

        });
    };
});
