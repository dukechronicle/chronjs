// Analytics
    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-5900287-15']);
    _gaq.push(['_setDomainName', 'qduke.com']);
    _gaq.push(['_trackPageview']);

    (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();

$(function(){
    // Outbound Link Tracking with Google Analytics
    // Requires jQuery 1.7 or higher (use .live if using a lower version)
    // http://wptheming.com/2012/01/tracking-outbound-links-with-google-analytics/
    $("a").on('click',function(e){
        var url = $(this).attr("href");
        // TODO(rivkees): If using dynamic weather, change this
        var text = $(this).text() || url
        if (e.currentTarget.host != window.location.host) {
            console.log(text)
            _gaq.push(['_trackEvent', 'Outbound Links', text, url, 0]);
            if (e.metaKey || e.ctrlKey) {
                 var newtab = true;
            }
            if (!newtab) {
                 e.preventDefault();
                 setTimeout('document.location = "' + url + '"', 100);
            }
        }
    });

    // Uservoice
    var uvOptions = {};
    (function() {
        var uv = document.createElement('script'); uv.type = 'text/javascript'; uv.async = true;
        uv.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'widget.uservoice.com/SMeZbkqkN4ufhQRlnWig.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(uv, s);
    })();

    // Search Focus
    $('.boxSearch input').focus();

    // Load Articles
    $(document).ready(function() {
        $.ajax({
            url: 'http://www.dukechronicle.com/api/qduke',
            dataType: "jsonp",
            cache: false,
            timeout: 10000,
            success: function(data) {
                showArticles(data.docs)
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("Error loading articles.")
            }
        });
    });
});

function showArticles(docs) {
    var count = 0;
    var rowNews = $(".rowNews");
    var sections = ['Breaking', 'Slideshow', 'Top Headline', 'Popular'];
    for (var section in sections) {
        var articles = docs[sections[section]];
        for (var i in articles) {
            var article = articles[i];
            var img ="";
            try {
                img = article.images.ThumbRect.url;
            }
            catch(err) {
                img = "";
            }
            rowNews.append(newArticle(article.title, img, article.url));
            count++;
            if (count >= 4) return;
        }
    }
}

function newArticle(title, img, url) {
    var newbox = $("<a>").addClass("box").attr("href", "http://dukechronicle.com" + url);
    var cap = $("<div>").addClass("caption").append($("<div>").addClass("txt").text(title));
    var img = $("<img>").attr("src", img);
    return newbox.append(cap).append(img);
}