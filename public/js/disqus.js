var disqus_developer = 1; // developer mode is on. REMOVE THIS IN PRODUCTION SET UP
var disqus_shortname = 'dukechronicle';
var disqus_identifier;
var disqus_title;

function loadDisqusForArticle(articleID, title)
{
	disqus_identifier = articleID;
    disqus_title = title;
	
	(function() {
	    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
	    dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
	    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
	})();
}

function loadDisqus()
{
	(function () {
	    var s = document.createElement('script'); s.async = true;
	    s.type = 'text/javascript';
	    s.src = 'http://' + disqus_shortname + '.disqus.com/count.js';
	    (document.getElementsByTagName('HEAD')[0] || document.getElementsByTagName('BODY')[0]).appendChild(s);
	}());
}

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

