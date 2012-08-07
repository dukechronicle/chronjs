// Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-5900287-15']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

function doMagic() {
    $('#search input').focus();
    addListeners();
    loadDynamics();
    loadArticles();
    
    // Uservoice
    var uvOptions = {};
    (function() {
        var uv = document.createElement('script'); uv.type = 'text/javascript'; uv.async = true;
        uv.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'widget.uservoice.com/SMeZbkqkN4ufhQRlnWig.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(uv, s);
    })();
}

function loadDynamics() {
    // Weather - http://monkeecreate.github.com/jquery.simpleWeather/#docs
    $.simpleWeather({
            zipcode: '27708',
            unit: 'f',
            success: function(weather) {
                    html = "Now: ";
                    html += weather.currently + ", ";
                    html += weather.temp+'&deg; '+weather.units.temp;
                    $("#weather .element").html(html);
                    $("#weather .element").parent().css("background-image", "url("+weather.image+")").css("background-repeat", "no-repeat").css("background-position", "-5px -12px").css("background-size", "100%");  
            },
            error: function(error) {
                    $("#weather .element").html("Weather");
            }
    });
    // Date
    var myDate = new Date();
    var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
    var dayNames = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
    $("#time .element").html( dayNames[myDate.getDay()] + ', <br />' + monthNames[myDate.getMonth()] + " " + myDate.getDate() + ', ' + myDate.getFullYear() );
}

var articles;
var articleIndex = -1;
var timer;

function loadArticles() {
    $(document).ready(function() {
        $.ajax({
            url: 'http://www.dukechronicle.com/api/all',
            dataType: "jsonp",
            cache: false,
            timeout: 10000,
            success: function(data) {
                articles = data.docs
                next()
                timer = setInterval(function(){next()},4000);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $("#newsbox .element").html("Error: Could not load articles.")
            }
        });
    });
}

function next() {
    if (++articleIndex >= articles.length) {
        articleIndex = 0
    }
    showArticle(articleIndex)
}

function nextArticle() {
    clearInterval(timer)
    next()
}

function prevArticle() {
    clearInterval(timer)
    if (--articleIndex < 0) {
        articleIndex = articles.length - 1
    }
    showArticle(articleIndex)
}

function showArticle(index) {
    $("#newsbox .element").html(articles[index].title)
    urls = articles[index].urls
    $("#newsbox a").attr("href", "http://dukechronicle.com/article/" + urls[urls.length-1])
}

// http://wptheming.com/2012/01/tracking-outbound-links-with-google-analytics/
function addListeners() {
    $("a").on('click',function(e){
        var url = $(this).attr("href");
        var text = $(this).attr("id") || $(this).text() || url
        if (e.currentTarget.host != window.location.host) {
            _gat._getTrackerByName()._trackEvent("Outbound Links", text, url);
            if (e.metaKey || e.ctrlKey) {
                 var newtab = true;
            }
            if (!newtab) {
                 e.preventDefault();
                 setTimeout('document.location = "' + url + '"', 100);
            }
        }
    });
}

function searchOnEnter(e) {
    if (e.keyCode == 13) {
        search()
    }
}

function search(engine) {
    var target = engine || "Google";

    var redirect;
    var query = $('#search input').val() || "";
    if (target == "Duke") {
        redirect = 'http://duke.edu/search/?q=' + query;
    } else if (target == "WolframAlpha") {
        redirect = 'http://www.wolframalpha.com/input/?i=' + query;
    } else {
        redirect = 'http://google.com/search?q=' + query;
    }
    _gat._getTrackerByName()._trackEvent("Search", query);
    setTimeout('document.location = "' + redirect + '"', 100);
}
