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

// Search Functions
function search(engine) {
    var target = engine || "Google";

    var redirect;
    var query = $('.boxSearch input').val() || "";
    if (target == "Duke") {
        redirect = 'http://duke.edu/search/?q=' + query;
    } else if (target == "WolframAlpha") {
        redirect = 'http://www.wolframalpha.com/input/?i=' + query;
    } else {
        redirect = 'http://google.com/search?q=' + query;
    }
    _gaq.push(['_trackEvent', 'Search', target, query, 0]);
    // TODO(rivkees): allow new window
    setTimeout('document.location = "' + redirect + '"', 100);
}
function searchOnEnter(e) {
    if (e.keyCode == 13) {
        search()
    }
}

// Article Logic
function showArticles(docs) {
    var count = 0;
    var boxStories = $(".boxStories .boxEmpty");
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
            $(boxStories[count]).attr("href", "http://dukechronicle.com" + article.url).append(
                $("<div>").addClass("caption").append($("<div>").addClass("txt").text(article.title))).append(
                $("<img>").attr("src", img)).removeClass("boxEmpty");
            count++;
            if (count >= 4) return;
            
        }
    }
}

// Tab Switching
function changeTab(tab) {
    $(".menu .box").removeClass("selected");
    $("#tabFrame .tabContent").removeClass("tabShown");

    setTimeout(function(){
        $(".menu .box:nth-child("+(tab*2-1)+")").addClass("selected");
        $("#tabFrame .tabContent:nth-child("+tab+")").addClass("tabShown");
    }, 500);
    _gaq.push(['_trackEvent', 'Change Tab', $(".menu .box:nth-child("+(tab*2-1)+")").text(), tab, 0]);
}

// On Load
$(function(){
    // Outbound Link Tracking with Google Analytics
    // Requires jQuery 1.7 or higher (use .live if using a lower version)
    // http://wptheming.com/2012/01/tracking-outbound-links-with-google-analytics/
    $("a:not(.boxButton)").on('click',function(e){
        var url = $(this).attr("href");
        // TODO(rivkees): If using dynamic weather, change this
        var text = $(this).text() || url
        if (e.currentTarget.host != window.location.host) {
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
    // var uvOptions = {};
    // (function() {
    //     var uv = document.createElement('script'); uv.type = 'text/javascript'; uv.async = true;
    //     uv.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'widget.uservoice.com/SMeZbkqkN4ufhQRlnWig.js';
    //     var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(uv, s);
    // })();

    // Search Focus
    $('.boxSearch input').focus();

    // Load Articles
    $(document).ready(function() {
        $.ajax({
            url: 'http://www.dukechronicle.com/api/qduke',
            dataType: "jsonp",
            cache: false,
            timeout: 20000,
            success: function(data) {
                showArticles(data.docs)
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // TODO(rivkees): display error
                $(".boxStories .boxEmpty").text("Error Loading Articles.")
                console.log("Error loading articles:" + errorThrown)
            }
        });
    });

    // Load Intense Frames
    $("#tabFrame .tabContent[data-content]").each(function(index, element){
        $(element).append($(element).attr("data-content"));
    });
});