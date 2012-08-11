define(['jquery', 'libs/jquery.chained'], function ($) {

    return {
        'select[data-chain]': function ($elements) {
            $elements.each(function () {
                $(this).chained('#' + $(this).data('chain'));
            });
        }
    }

});
