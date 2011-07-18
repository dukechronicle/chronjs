var disqus_developer = 1; // developer mode is on. REMOVE THIS IN PRODUCTION SET UP
var disqus_shortname = 'dukechronicle';
var disqus_identifier;

function loadDisqus(articleID)
{
	disqus_identifier = articleID;
	
	(function() {
	    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
	    dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
	    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
	})();
}
