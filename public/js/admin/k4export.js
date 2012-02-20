define(['jquery'], function ($) {

    $(function () {

        $("button").click(function () {
            $(this).attr('disabled', 'disabled');
            var article = JSON.parse($(this).attr('value'));
            var $row = $(this).parent().parent();
            var $button = $(this);
            editDocument(article, $row, function (err) {
	        if (err) alert(err);
		$button.removeAttr('disabled');
            });
        });

        $("select.image").change(function () {
            showImage($(this));
        });

    });

    function editDocument(article, $row, callback) {
        article.taxonomy = $row.find("td > .taxonomy").val();
        if (!article.taxonomy)
            return callback("Must select a section for article "+article.title);
        article.taxonomy = JSON.parse(article.taxonomy);

        var fields = { doc: { id: article.id, taxonomy: article.taxonomy } };

        $.post('/api/article/edit', fields, function(data, status) {
	    if (status != 'success')
	        callback("Taxonomy change for article '" + article.title + "' failed");
            else
                addImageVersions(article.id, $row.find("td > .image"), callback);
        });
    }

    function addImageVersions(docId, $image, callback) {
        try {
            var imageData = JSON.parse($image.val());

            var fields = {
                docId: docId,
                versionId: imageData.imageVersions,
                original: imageData.originalId,
                imageType: imageData.imageVersionTypes
            };

            $.post('/api/article/version/add', fields, function (data, status) {
                if (status != 'success')
	            callback("Adding image to article '" + article.title + "' failed");
                else
                    callback();
            });
        }
        catch (e) {
            callback();
        }
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
