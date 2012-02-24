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
        var taxonomy = $row.find("td > .taxonomy").val();
        if (!taxonomy)
            return callback("Must select a section for article");

        var article = new Article({
            id: $row.attr('id'),
            taxonomy: JSON.parse(taxonomy)
        });

        try {
            var imgDDElement = $row.find("#img"+$row.attr('id'));
            var imageData = JSON.parse(imgDDElement.val());
            article.addImageVersions(imageData.originalId, imageData.imageVersions, imageData.imageVersionTypes);
        }
        catch (e) {}

        $.post('/api/article/edit', article.toJSON(), function(data, status) {
	    if (status == 'success') callback();
            else callback("Taxonomy change for article failed");
        });
    }
});
