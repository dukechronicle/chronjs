function editDocument(article) {
    $("#sub"+article.id).attr('disabled', 'disabled');
    
    article.taxonomy = $("#tax"+article.id).val();
    article.authors = article.authors.toString();
    
    var imageString = $("#img"+article.id).val();
    var imageData;
    if (imageString.length > 0) {
    	imageData = JSON.parse(imageString);
    }
    
    $.post('/admin/edit', { doc: article }, function(data, status) {
	if (status != 'success')
	    alert("Taxonomy change for article '" + article.title + "' failed");
	if (imageData != null) {
	  $.post('/admin/edit', {imageVersionId: imageData.imageVersions})
	}
	else
		$("#sub"+article.id).removeAttr('disabled');
    });
}

function showImage(articleId) {
    var imageString = $("#img"+articleId).val();
    var imageData;

    if (imageString.length > 0) {
    	imageData = JSON.parse(imageString);
        $("#img-preview"+articleId).attr('src', imageData.thumbUrl);
        $("#img-preview"+articleId).fadeIn();
    }
    else {
        $("#img-preview"+articleId).fadeOut();
    }
}
