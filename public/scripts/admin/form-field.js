define(['jquery'], function ($) {

    return {

        '.add-field': function () {
            $('.add-field').click(function (e) {
                e.preventDefault();
                var $items = $(this).parent().parent().children('li');
                var index = $items.index($(this).parent());
                var name = $(this).data('name') + '[' + index + ']';

                var $field = $('<li><input class="span4" type="text"/></li>');
                $field.children('input').attr('name', name);
                $(this).parent().before($field);
            });
        }

    }

});