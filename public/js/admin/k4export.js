define(['jquery', 'Article'], function ($, Article) {

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

        $("select.image").change(function () {
            showImage($(this));
        });

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
            var imageData = JSON.parse($row.find("td > .image").val());
            article.addImageVersions(imageData.originalId,
                                     imageData.imageVersions,
                                     imageData.imageVersionTypes);
        }
        catch (e) {}

        $.post('/api/article/edit', article.toJSON(), function(data, status) {
	    if (status == 'success') callback();
            else callback("Taxonomy change for article failed");
        });
    }

    function showImage($image) {
        var $preview = $image.parent().parent().find("td > img.preview");
        try {
    	    var imageData = JSON.parse($image.val());
            $preview.attr('src', imageData.thumbUrl);
            $preview.fadeIn();
        }
        catch (e) {
            $preview.fadeOut();
        }
    }

});
