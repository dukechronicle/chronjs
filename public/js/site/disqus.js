// sets whether developer mode is on. should be off (0) in production set up 
var disqus_developer = 0;

var disqus_shortname;
var disqus_url;
var disqus_identifier;
var disqus_title;
var disqus_config;

function appendCommentCount() {
    var count = $("#dsq-num-posts").html();

    if($("#dsq-total-posts").html() != null) {
        count = $("#dsq-total-posts").html();
    }

    var newText = $("#commentLink").html() + " ("+count+")";
    $("#commentLink").html(newText);
}

function disqus_config() {
    this.callbacks.afterRender = [function() {
        appendCommentCount();
    }];
}

$(function() {
    var params = $("#disqus_thread").data('disqus');
    loadDisqusForArticle(params.isProduction, params.shortname, params.id,
                         params.title, params.url);
});

function loadDisqusForArticle(isProduction, disqusShortName, articleID, title, url)
{
	disqus_shortname = disqusShortName;
	disqus_identifier = articleID;
	disqus_title = title;
	disqus_url = "http://dukechronicle.com" + url;
	
	if(!isProduction) disqus_developer = 1;

	(function() {
		var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
		dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
		(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
	})();
}
