define(['jquery'], function ($) {

    $(function () {

        $("button").click(function () {
            $(this).attr('disabled', 'disabled');
            var article = JSON.parse($(this).attr('value'));
            var $row = $(this).parent().parent();
            editDocument(article, $row, function (err) {
	        if (err) alert(err);
		$(this).removeAttr('disabled');
            });
        });

        $("select.image").change(function () {
            showImage($(this));
        });

    });

    function editDocument(article, $row, callback) {
        article.taxonomy = $row.children(".taxonomy").val();
        if (!article.taxonomy)
            return callback("Must select a section for article "+article.title);

        article.authors = article.authors.toString();
    
        var imageString = $row.children(".image").val();
        var imageData;
        if (imageString.length > 0) {
    	    imageData = JSON.parse(imageString);
        }

       
        $.post('/admin/edit', { doc: article }, function(data, status) {
	    if (status != 'success')
	        alert("Taxonomy change for article '" + article.title + "' failed");
	    
            if (imageData != null && imageData.imageVersions != null && imageData.imageVersions.length > 0) {
	        $.post('/admin/edit', {imageVersionId: imageData.imageVersions, docId: article.id, original: imageData.originalId, imageType: imageData.imageVersionTypes},
                       function(data, status) {
                           if (status != 'success')
	                       alert("Adding image for article '" + article.title + "' failed");
                           
                           callback();
                       });
	    }
            else callback();
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
