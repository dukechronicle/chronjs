function editDocument(article) {
    $("#sub"+article.id).attr('disabled', 'disabled');
    article.taxonomy = JSON.stringify($("#tax"+article.id).val().split(","));
    article.authors = JSON.stringify(article.authors);
    $.post('/admin/edit', { doc: article }, function(data, status) {
	if (status != 'success')
	    alert("Taxonomy change for article '" + article.title + "' failed");
	$("#sub"+article.id).removeAttr('disabled');
    });
}