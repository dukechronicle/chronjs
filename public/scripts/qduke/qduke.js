var qDuke_api_url = 'http://localhost:8000/qduke';//'http://chronproxy.herokuapp.com/qduke'; //

/******************
* Analytics Setup *
*******************/
    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-5900287-15']);
    _gaq.push(['_setDomainName', 'qduke.com']);
    _gaq.push(['_trackPageview']);

    (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();

/***********************
* Search Functionality *
************************/
// checkSearchActive handles the color changing behavior of action buttons based on user input.
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

// searchOnEnter checks if the return key has been pressed, and if so clicks the search button.
function searchOnEnter(e) {
    setTimeout("checkSearchActive()", 5);
    if (e.keyCode == 13) {
        $(".rowSearch #GoogleSearchButton").click();
    }

}

/* Tab Functionality */
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
* AJAX Functionality *
**********************/
// loadChronAPI loads news, headlines, sports, OIT, and twitter data from the qDuke api.
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
        $(boxStories[i]).attr("href", article.link).append(
            $("<div>").addClass("caption").append($("<div>").addClass("txt").text(article.title))).append(
            $("<img>").attr("src", article.img)).removeClass("boxEmpty");
    }
    var count = $("#boxStatus").length; var maxCount = 4;
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
        // Check if status bar is full
        if (count >= maxCount) return;
        else count++;
        displayLiveSports(data.liveSports);
        setInterval(updateLiveScores, 30000);
    }
    // OIT
    if (data.oit != undefined) {
        // Check if status bar is full
        if (count >= maxCount) return;
        else count++;
        alert = data.oit;
        $("#boxStatus").append(
            $("<a data-tracking='OIT Alert' class='box StatusOIT' />").on('click', linkTrack).attr("href", alert.link).html("<span class='strong'>OIT Alert</span> ("+alert.date+"): " + alert.title)
        );
    }
    // Twitter
    for (handle in data.twitter) {
        // Check if status bar is full
        if (count >= maxCount) return;
        else count++;
        tweet = data.twitter[handle];
        $("#boxStatus").append(
            $("<a data-tracking='Twitter "+handle+"' class='box StatusTweet' />").on('click', linkTrack).attr("href", tweet.twitterLink).html("<span class='strong'>"+handle+ ":</span> " + tweet.text)
        );
    }
}

/* Live Sports Scores */
// updateLiveScores makes a call to the qDuke API to update the score.
function updateLiveScores() {
    $.ajax({
        url: qDuke_api_url,
        dataType: "json",
        cache: false,
        timeout: 5000,
        success: function(data) {
            displayLiveSports(data.liveSports);
        }
    });
}

// displayLiveSports takes in a game object and adds it to the DOM.
function displayLiveSports(game) {
    console.log(game)
    game.team1score = game.team1score || "";
    game.team2score = game.team2score || "";
    var score = '<p class="StatusTime">'+game.time+'</p><p class="StatusTeam"> '+game.team1+'<span class="StatusScore">'+game.team1score+'</span></p><p class="StatusTeam"> '+game.team2+'<span class="StatusScore">'+game.team2score+'</span></p>'
    // TODO(rivkees): check if already there, and if so do in place
    $("#"+game.sport).remove();
    $("#boxStatus").append(
        $("<a data-tracking='Live Sports' class='box StatusSportScore' id="+game.sport+" />").on('click', linkTrack).attr("href", game.link).html(score)
    );
    $("#"+game.sport+" p:nth-child("+game.winner+")").addClass("strong");
}

/* Weather */
// showWeather adds the weather info to the DOM.
function showWeather(weather) {
    // Check if status bar is full
    var count = $("#boxStatus").length; var maxCount = 4;
    console.log(count);
    if (count >= maxCount) return;

    var forcast = '<img src="'+weather.thumbnail+'"/><p> '+weather.currently+', '+weather.temp+'&deg;'+weather.units.temp+'</p><p>'+weather.city+", "+weather.region+'</p>'
    $("#boxStatus").append(
        $("<a data-tracking='Weather' class='box StatusWeather' />").on('click', linkTrack).attr("href", weather.link).html(forcast)
    );
}

var channels = {
    'ESPN': '/img/qduke/channels/espn.png',
    'ESPN2': '/img/qduke/channels/espn2.png',
    'ESPN3': '/img/qduke/channels/espn3.png',
    'ESPNU': '/img/qduke/channels/espnu.png',
}

/* Sport Schedule Functionality */
// changes the sport schedule shown in the sports tab.
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

// sports loads the schedule at the given URL into the sports tab.
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
                dc = $(this).find("pubDate").text();
                //tournamentname = $(this).find("tournamentname").text();
                homeaway = $(this).find("homeaway").text();
                if (homeaway == "H") homeaway = "vs.";
                else if (homeaway == "A") homeaway = "@";
                else if (homeaway == "N") homeaway = "";
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
            });
        }
    });
}

// Outbound Link Tracking function
linkTrack = function(e){
    console.log("track")
    var url = $(this).attr("href");
    var text = $(this).attr("data-tracking") || $(this).text() || url
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
}

/*********************
*       On Load      *
**********************/
$(function(){
    // Adds onClick behavior to all links.
    //      Requires jQuery 1.7 or higher (use .live if using a lower version)
    //      http://wptheming.com/2012/01/tracking-outbound-links-with-google-analytics/

    /* Outbound Link Tracking */
    $("a:not(.boxButton, .boxMenu, .boxSport, .boxNews)").on('click', linkTrack);
    /* News Tracking */
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
    /* Search Tracking */
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

    /* Puts user cursor in the search box */
    $('.boxSearch input').focus();

    /* Initial AJAX request */
    $(document).ready(function() {
        // ChronAPI
        $.ajax({
            url: qDuke_api_url,
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

    /* Delay loading embedded iframes */
    // TODO(rivkees): dont actually do this until a user clicks the tab?
    $("#tabFrame .tabContent[data-content]").each(function(index, element){
        $(element).append($(element).attr("data-content"));
    });

    /* Load default sports schedule */
    sports("http://www.goduke.com/rss.dbml?db_oem_id=4200&media=schedulesxml");

    /* Start Tour */
    $('#joyRideTipContent').joyride({
        'cookieMonster': true,
        'cookieName': 'qDukeNov26',
    });
});