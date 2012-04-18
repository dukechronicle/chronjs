var k4export;

define(['jquery', 'Article', 'libs/jquery.dd'], function ($, Article) {

    k4export = function () {

        $(".export-index button").click(function () {
            $(this).attr('disabled', 'disabled');
            var $row = $(this).parent().parent();
            var $button = $(this);
            editDocument($row, function (err) {
                if (err) alert(err);
                $row.fadeOut('fast', function () {
                    $row.remove();
                });
            });
        });

        try {
            $("[id^=img]").msDropDown({visibleRows:4, rowHeight:100});
        } catch(e) {
            alert(e.message);
        }
    };

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

        article.save(null, {
            url: '/api/article/' + id,
            success: function(data, status, jqXHR) {
                callback(null, data);
            },
            error: function (jqXHR, status, errorThrown) {
                callback(status.responseText);
            }
        });
    }
});
