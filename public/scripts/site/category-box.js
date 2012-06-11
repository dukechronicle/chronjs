define(['jquery'], function($) {

    var selected = $([]);
    var selectedNav = $([]);

    return { ".category-box": columnistSelect }

    function columnistSelect () {
        $('.category-list a').click(function(e) {
            e.preventDefault();
            show($(this).data('index'));
        });
        
        // randomly select a columnist
        show(Math.floor(Math.random() * $('.category-list a').size()));
    };

    function show(index) {
        selectedNav.removeClass('selected');
        selectedNav = $('.category-list a').eq(index);
        selectedNav.addClass('selected');

        selected.hide();
        selected = $('.category').eq(index);
        selected.show();
        while (selected.height() > selected.parent().height()) {
            selected.find("a:last").remove();
        }
    }

});