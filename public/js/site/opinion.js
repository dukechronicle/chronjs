define(['jquery'], function($) {

    var selected = $([]);
    var selectedNav = $([]);

    $(function () {
        $('#columnists').show();

        $('#columnist-list .content-container').on("click", "a", function(e) {
            e.preventDefault();
            selectedNav.removeClass('selected');
            selected.hide();
            selectedNav = $(this);
            show(selectedNav.attr('data-index'));
        });
        
        // randomly select a columnist
        var columnistAnchors = $('#columnist-list h2 a');
        var randomIndex = Math.floor(Math.random()*columnistAnchors.size());
        columnistAnchors.eq(randomIndex).click();
    });

    function show(index) {
        selected = $("#columnist-story-" + index);
        selectedNav.addClass('selected');
        selected.show();
    }

});