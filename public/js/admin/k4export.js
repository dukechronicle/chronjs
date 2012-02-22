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
        
        console.log(article.toJSON());

        return callback();
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
