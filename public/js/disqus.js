// sets whether developer mode is on. should be off (0) in production set up 
var disqus_developer = 0;
var disqus_shortname, disqus_url, disqus_identifier, disqus_title, disqus_config;

function loadDisqusForArticle(isProduction, shortName, articleID, title, url)
{
    disqus_shortname = shortName;
    disqus_identifier = articleID;
    disqus_title = title;
    disqus_url = "http://dukechronicle.com" + url;
    disqus_developer = isProduction ? 0 : 1;

    var dsq = document.createElement('script');
    dsq.type = 'text/javascript';
    dsq.async = true;
    dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
    (document.getElementsByTagName('head')[0] ||
     document.getElementsByTagName('body')[0]).appendChild(dsq);
}
