define(['jquery', 'lib/jquery.chained'], function ($) {

    return {
        'select[data-chain]': function () {
            $(this).each(function () {
                $(this).chained('#' + $(this).data('chain'));
            });
        }
    }

});
