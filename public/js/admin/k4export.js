function editDocument(article) {
    $("#sub"+article.id).attr('disabled', 'disabled');
    article.taxonomy = $("#tax"+article.id).val();
    article.authors = article.authors.toString();
    $.post('/admin/edit', { doc: article }, function(data, status) {
	if (status != 'success')
	    alert("Taxonomy change for article '" + article.title + "' failed");
	$("#sub"+article.id).removeAttr('disabled');
    });
}