// TODO(rivkees): tracking for status bar

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

function checkSearchActive() {
    if ($('.boxSearch input').val() && $('.boxSearch input').val().length > 0) {
        $(".boxButton").addClass("queryActive");
        if (!$('.boxSearch input').is(":focus")){
            $(".boxButton").addClass("searchInactive");    
        } else {
            $(".boxButton").removeClass("searchInactive");   
        }
    } else {
        $(".boxButton").removeClass("queryActive");
    }
}

function searchOnEnter(e) {
    setTimeout("checkSearchActive()", 5);
    if (e.keyCode == 13) {
        $(".rowSearch #GoogleSearchButton").click();
    }

}

// Tab Switching
function changeTab(tab) {
    $(".tabMenu .boxMenu").removeClass("selectedTab");
    $("#tabFrame .tabContent").removeClass("tabShown");

    setTimeout(function(){
        $(".tabMenu .boxMenu:eq("+(tab-1)+")").addClass("selectedTab");
        $("#tabFrame .tabContent:eq("+(tab-1)+")").addClass("tabShown");
    }, 500);
    _gaq.push(['_trackEvent', 'Change Tab', $(".tabMenu .boxMenu:eq("+(tab-1)+")").text(), 1, 0]);
}

/*********************
* AJAX Loading Stuff *
**********************/
// Load Chron API
function loadChronAPI(data) {
    console.log(data);
    // News
    var boxStories = $(".boxStories .boxEmpty");
    for (var i = 0; i < data.news.length; i++) {
        article = data.news[i];
        // Special By section
        if (article.type == 'Breaking') {
            $(boxStories[i]).addClass("breaking").append(
            $("<div>").addClass("caption captionTop").append($("<div>").addClass("txt").text("Breaking")));
        }
        if (article.type == 'Sports Blog') {
            $(boxStories[i]).append(
            $("<div>").addClass("caption captionTop").append($("<div>").addClass("txt").text("Sports Blog")));
        }
        if (article.img == undefined) article.img = "/img/qduke/default_image.jpg";
        $(boxStories[i]).attr("href", "http://dukechronicle.com" + article.link).append(
            $("<div>").addClass("caption").append($("<div>").addClass("txt").text(article.title))).append(
            $("<img>").attr("src", article.img)).removeClass("boxEmpty");
    }
    // Headline
    // if (docs["Top Headline"] != undefined) {
    //     console.log("top headline");
    //     for (var i in docs["Top Headline"]) {
    //         console.log(i)
    //         var article = docs["Top Headline"][i];
    //         $("#boxStatus").append(
    //             $("<a class='box' />").attr("href", "http://dukechronicle.com" + article.url).html("<p>"+article.title+"</p>")
    //         );
    //     }
    // }
    // Sports
    if (data.liveSports != undefined) {
        displaySports(data.liveSports);
        setInterval(updateLiveScores, 30000);
    }
    // Twitter
    for (handle in data.twitter) {
        tweet = data.twitter[handle];
        console.log(tweet);
        $("#boxStatus").append(
            $("<a class='box StatusTweet' />").attr("href", tweet.twitterLink).html("<span class='handle'>"+handle+ ":</span> " + tweet.text)
        );
    }
}

// Live Scores
function updateLiveScores() {
    $.ajax({
        url: 'http://chronproxy.herokuapp.com/qduke',
        dataType: "json",
        cache: false,
        timeout: 5000,
        success: function(data) {
            displaySports(data.liveSports);
        }
    });
}

function displaySports(game) {
    var score = '<p class="StatusTeam"> '+game.team1+'</p><p class="StatusTeam"> '+game.team2+'</p><p class="bottomRightCaption">'+game.time+'</p>'
    // TODO(rivkees): check if already there, and if so do in place
    $("#"+game.sport).remove();
    $("#boxStatus").append(
        $("<a class='box StatusSportScore' id="+data[5]+" />").attr("href", game.link).html(score)
    );
    $("#"+game.sport+" p:nth-child("+game.winner+")").addClass("StatusWon");
}

// Weather
function showWeather(weather) {
    var forcast = '<p> '+weather.currently+', '+weather.temp+'&deg;'+weather.units.temp+'</p><img src="'+weather.thumbnail+'"/><p class="bottomRightCaption">'+weather.city+'</p>'
    $("#boxStatus").append(
        $("<a class='box' />").attr("href", weather.link).html(forcast)
    );
    // var forcast = '<h3>Tomorrow</h3><p>'+weather.tomorrow.forecast+'</p><p>High '+weather.tomorrow.high+'&deg;'+weather.units.temp+' - Low '+weather.tomorrow.low+'&deg;'+weather.units.temp;
    // $("#boxStatus").append(
    //     $("<a class='box' />").attr("href", weather.link).html(forcast)
    // );       
}

var channels = {
    'ESPN': '/img/qduke/channels/espn.png',
    'ESPN2': '/img/qduke/channels/espn2.png',
    'ESPN3': '/img/qduke/channels/espn3.png',
    'ESPNU': '/img/qduke/channels/espnu.png',
}

function changeSport(id, name) {
    if (id != "") {
        sports("http://www.goduke.com/rss.dbml?db_oem_id=4200&media=schedulesxml&RSS_SPORT_ID="+id);
    } else {
        sports("http://www.goduke.com/rss.dbml?db_oem_id=4200&media=schedulesxml");
    }
    $(".sportsList a").removeClass("selected");
    $(".sportsList a#sportID"+id).addClass("selected");
    _gaq.push(['_trackEvent', 'Change Sport', name, 1, 0]);
}

// Parse RSS to JSON
function sports(url) {
    $.ajax({
        url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&output=xml&num=20&callback=?&q=' + encodeURIComponent(url),
        dataType: 'json',
        success: function(data) {
            $("#contentSports .scheduleBox #sportSchedule").html("");
            xml = $.parseXML(data.responseData.xmlString);
            date = "";
            $(xml).find("item").each(function(){
                sport = $(this).find("sport").text();
                opponent = $(this).find("opponent").text();
                loc = $(this).find("location").text();
                time = $(this).find("time").text();
                tv = $(this).find("tv").text();
                //tournamentname = $(this).find("tournamentname").text();
                homeaway = $(this).find("homeaway").text();
                if (homeaway == "H") homeaway = "vs.";
                else if (homeaway == "A") homeaway = "@";
                else if (homeaway == "N") homeaway = "";
                dc = $(this).find("pubDate").text();
                //guid = $(this).find("guid").text();
                // if (date != dc) {
                //     $("#contentSports .scheduleBox").append("<h4 class='sportDate'>"+dc+"</h4>");
                //     date = dc;
                // }
                if (channels[tv] != undefined ) {
                    tv = " <td class='sportTv'><img src='"+channels[tv]+"' /></td>";
                }
                else {
                    tv = " <td class='sportTv'>"+tv+"</td>";
                }
                $("#contentSports .scheduleBox #sportSchedule").append("<tr class='sportEvent'>"
                        +"<td class='sportDate'>"+dc+"</td>"
                        +"<td class='sportTime'>"+time+"</td>"
                        +"<td class='sportTeam'>"+sport+"</td> "
                        +"<td class='sportOpponent'>"+homeaway+" "+opponent+"</td>"
                        //+" <td class='sportLocation'>"+loc+"</td>"
                        +tv
                    +"</tr>");
                //console.log($(this));
            });
        }
    });
}

// On Load
$(function(){
    // Outbound Link Tracking with Google Analytics
    // Requires jQuery 1.7 or higher (use .live if using a lower version)
    // http://wptheming.com/2012/01/tracking-outbound-links-with-google-analytics/
    $("a:not(.boxButton, .boxMenu, .boxSport, .boxNews)").on('click',function(e){
        var url = $(this).attr("href");
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
    // News Only
    $("a.boxNews").on('click',function(e){
        var url = $(this).attr("href");
        var text = $(this).text() || url
        if (e.currentTarget.host != window.location.host) {
            _gaq.push(['_trackEvent', 'Outbound News', text, url, 0]);
            if (e.metaKey || e.ctrlKey) {
                 var newtab = true;
            }
            if (!newtab) {
                 e.preventDefault();
                 setTimeout('document.location = "' + url + '"', 100);
            }
        }
    });
    // Search Links and Tracking
    $("a.boxButton").on('click',function(e){
        if (e.metaKey || e.ctrlKey) {
             var newtab = true;
        }
        var redirect;
        var query = $('.boxSearch input').val() || "";
        var target = $(this).text();
        if (query != "") {
            query = encodeURIComponent(query);
            if (target == "Duke (Directory)") {
                redirect = 'http://duke.edu/search/?q=' + query;
            } else if (target == "WolframAlpha") {
                redirect = 'http://www.wolframalpha.com/input/?i=' + query;
            } else if (target == "Wikipedia") {
                redirect = 'http://en.wikipedia.org/wiki/Special:Search?search=' + query;
            } else if (target == "Google"){
                redirect = 'http://google.com/search?q=' + query;
            }
            _gaq.push(['_trackEvent', 'Search', target, query, 0]);
            e.preventDefault();
            if (!newtab) {
                setTimeout('document.location = "' + redirect + '"', 100);
            } else {
                window.open(redirect, "_blank");
            }
        } else {
            redirect = $(this).attr("href");
            _gaq.push(['_trackEvent', 'Outbound Links', target, redirect, 0]);
            if (!newtab) {
                e.preventDefault();
                setTimeout('document.location = "' + redirect + '"', 100);
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

    // Load Dynamic Content on Load
    $(document).ready(function() {
        // ChronAPI
        $.ajax({
            url: 'http://chronproxy.herokuapp.com/qduke',
            dataType: "json",
            cache: false,
            timeout: 5000,
            success: function(data) {
                loadChronAPI(data)
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $(".boxStories .boxEmpty").text("Oops, couldn't load the articles. Try refreshing the page.")
                console.log("Error loading articles:" + errorThrown)
            }
        });
        // Load Weather
        $.simpleWeather({
            zipcode: '27708',
            unit: 'f',
            success: function(weather) {
                showWeather(weather);
            },
            error: function(error) {
                    //$("#contentWeather .box").html("<p>"+error+"</p>");
            }
        });
        // Search Button colors in case of back button
        setTimeout("checkSearchActive()", 5);
    });

    // Load Intense Frames
    // TODO(rivkees): dont actually do this until a user clicks the tab?
    $("#tabFrame .tabContent[data-content]").each(function(index, element){
        $(element).append($(element).attr("data-content"));
    });

    // Load Sports
    sports("http://www.goduke.com/rss.dbml?db_oem_id=4200&media=schedulesxml");

    // Tour
    $('#joyRideTipContent').joyride({
        'cookieMonster': true,
        'cookieName': 'qDukeNov26',
    });
});