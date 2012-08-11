define(['jquery', 'libs/jquery.chained'], function ($) {

    return {
        '#section0': function () {
            $('select').each(function () {
                match = $(this).attr('id').match(/section(\d+)/);
                if (match && match[1] > 0) {
                    $(this).chained('#section' + (match[1] - 1));
                }
            });
        }
    }

});
