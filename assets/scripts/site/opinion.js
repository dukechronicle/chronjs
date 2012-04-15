var columnistSelect;

define(['jquery'], function($) {

    var selected = $([]);
    var selectedNav = $([]);

    return columnistSelect = function () {
        $('#opinion #columnists').show();

        $('#opinion #columnist-list .content-container a').click(function(e) {
            e.preventDefault();
            selectedNav.removeClass('selected');
            selected.hide();
            selectedNav = $(this);
            show(selectedNav.attr('data-index'));
        });
        
        // randomly select a columnist
        var columnistAnchors = $('#opinion #columnist-list h2 a');
        var randomIndex = Math.floor(Math.random()*columnistAnchors.size());
        columnistAnchors.eq(randomIndex).click();
    };

    function show(index) {
        selected = $("#columnist-story-" + index);
        selectedNav.addClass('selected');
        selected.show();
    }

});