function editDocument(article) {
    $("#sub"+article.id).attr('disabled', 'disabled');
    article.taxonomy = JSON.stringify($("#tax"+article.id).val().split(","));
    article.authors = JSON.stringify(article.authors);
    $.post('/admin/edit', { doc: article }, function(data, status) {
	alert(status);
	$("#sub"+article.id).removeAttr('disabled');
    });
}