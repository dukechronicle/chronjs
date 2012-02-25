define(['jquery', 'Article', 'msdropdown'], function ($, Article) {

    $(function () {

        $("button").click(function () {
            $(this).attr('disabled', 'disabled');
            var $row = $(this).parent().parent();
            var $button = $(this);
            editDocument($row, function (err) {
	        if (err) alert(err);
		$button.removeAttr('disabled');
            });
        });

        try {
            $("[id^=img]").msDropDown({visibleRows:4, rowHeight:100});
        } catch(e) {
            alert(e.message);
        }
    });

    function editDocument($row, callback) {
        var id = $row.attr('id');
        var taxonomy = $row.find("td > .taxonomy").val();
        if (!taxonomy)
            return callback("Must select a section for article");

        var article = new Article({
            id: id,
            taxonomy: JSON.parse(taxonomy)
        });

        try {
            var imgDDElement = $row.find("#img"+$row.attr('id'));
            var imageData = JSON.parse(imgDDElement.val());
            article.addImageVersions(imageData.originalId, imageData.imageVersions, imageData.imageVersionTypes);
        }
        catch (e) {}

        $.ajax({
            type: 'PUT',
            url: '/api/article/' + id,
            data: article.toJSON(),
            success: function(data, status, jqXHR) {
                callback(null, data);
            },
            error: function (jqXHR, status, errorThrown) {
                callback(jqXHR.responseText);
            }
        });
    }
});
