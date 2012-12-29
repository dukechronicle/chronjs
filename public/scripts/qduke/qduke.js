var qDuke_api_url = 'http://qduke.herokuapp.com/api';

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
    /*  Loading embedded iframes */
    var tabRef = $("#tabFrame .tabContent:nth-child("+tab+")[data-content]")
    if ($("#tabFrame .tabContent:nth-child("+tab+")[data-content]") != ""){
        tabRef.append(tabRef.attr("data-content"));
        tabRef.attr("data-content", "")
    }

    $(".tabMenu .boxMenu").removeClass("selectedTab");
    $("#tabFrame .tabContent").removeClass("tabShown");

    $("#tabFrame .tabContent:eq("+(tab-1)+")").addClass("tabShown").css({'margin-top': '50px', opacity: 0}).transition({ 'margin-top':0, opacity: 1 }, 400, 'snap');
    $(".tabMenu .boxMenu:eq("+(tab-1)+")").addClass("selectedTab");

    _gaq.push(['_trackEvent', 'Change Tab', $(".tabMenu .boxMenu:eq("+(tab-1)+")").text(), '', 0]);
}

/*********************
* AJAX Functionality *
**********************/
// loadChronAPI loads news, headlines, sports, OIT, and twitter data from the qDuke api.
function loadChronAPI(data) {
    /* News Bar */
    var boxStories = $(".boxStories .boxEmpty");
    for (var i = 0; i < data.news.length; i++) {
        article = data.news[i];
        // Special By section
        if (article.type == 'Breaking') {
            $(boxStories[i]).addClass("breaking").append(
            $("<div>").addClass("captionTop").append($("<div>").addClass("txt").text("Breaking")));
        }
        if (article.type == 'Sports Blog') {
            $(boxStories[i]).append(
            $("<div>").addClass("captionTop").append($("<div>").addClass("txt").text("Sports Blog")));
        }
        if (article.img == undefined) article.img = "/img/qduke/default_image.jpg";
        $(boxStories[i]).attr("href", article.link).append(
            $("<div>").addClass("caption").append($("<div>").addClass("txt").text(article.title))).append(
            $("<img>").attr("src", article.img)).removeClass("boxEmpty").css(
            {'x': '50px', opacity: 0}).transition({ 'x':0, opacity: 1 }, 400, 'snap');
    }
    /* Status Bar */
    var count = $("#boxStatus").length; var maxCount = 4;
    // Sports
    if (data.liveSports != undefined && data.liveSports != null) {
        // Check if status bar is full
        if (count >= maxCount) return;
        else count++;
        displayLiveSports(data.liveSports);
        setInterval(updateLiveScores, 30000);
    }
    // Headline
    if (data.headlines != undefined && data.headlines != null) {
        for (var i in data.headlines) {
            // Check if status bar is full
            if (count >= maxCount) return;
            else count++;
            var article = data.headlines[i];
            appendWithTransition(
                $("<a class='box' />").on('click', linkTrack).attr("href", article.link).html("<p>"+article.title+"</p>")
            );
        }
    }
    // OIT
    if (data.oit != undefined && data.oit != null) {
        // Check if status bar is full
        if (count >= maxCount) return;
        else count++;
        alert = data.oit;
        appendWithTransition(
            $("<a data-tracking='OIT Alert' class='box StatusOIT' />").on('click', linkTrack).attr("href", alert.link).html("<span class='strong'>OIT Alert</span> ("+alert.date+"): " + alert.title)
        );
    }
    // Twitter
    for (handle in data.twitter) {
        // Check if status bar is full
        if (count >= maxCount) return;
        else count++;
        tweet = data.twitter[handle];
        appendWithTransition(
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
    game.team1score = game.team1score || "";
    game.team2score = game.team2score || "";
    var score = '<p class="StatusTime">'+game.time+'</p><p class="StatusTeam" id="StatusTeam1"> '+game.team1+'<span class="StatusScore">'+game.team1score+'</span></p><p class="StatusTeam" id="StatusTeam2"> '+game.team2+'<span class="StatusScore">'+game.team2score+'</span></p>'
    
    if ($("#"+game.sport).length == 0) {
        appendWithTransition(
            $("<a data-tracking='Live Sports' class='box StatusSportScore' id="+game.sport+" />").on('click', linkTrack).attr("href", game.link).html(score)
        ); 
    } else {
        $("#"+game.sport).attr("href", game.link).html(score);
        $("#"+game.sport).transition({ 'opacity': '0' }, 200).transition({ 'opacity': '1' }, 100);
    }

    $("#"+game.sport+" p#StatusTeam"+game.winner).addClass("strong");
}

/* Weather */
// showWeather adds the weather info to the DOM.
function showWeather(weather) {
    // Check if status bar is full
    var count = $("#boxStatus").length; var maxCount = 4;
    if (count >= maxCount) return;

    var forcast = '<img src="'+weather.thumbnail+'"/><p> '+weather.currently+', '+weather.temp+'&deg;'+weather.units.temp+'</p><p>'+weather.city+", "+weather.region+'</p>'
    
    appendWithTransition(
        $("<a data-tracking='Weather' class='box StatusWeather' />").on('click', linkTrack).attr("href", weather.link).html(forcast)
    );
}

function appendWithTransition(element) {
    $("#boxStatus").append(element);
    element.css({'x': '50px', opacity: 0}).transition({ 'x':0, opacity: 1 }, 400, 'snap');
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
    _gaq.push(['_trackEvent', 'Change Sport', name, '', 0]);
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
                else if (homeaway == "N")  homeaway = "";
                if (homeaway == "") {
                    opponent += " (" + loc + ")";
                }
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
            $("#contentSports .scheduleBox").css({'margin-top': '50px', opacity: 0}).transition({ 'margin-top':0, opacity: 1 }, 400, 'snap')
        }
    });
}

// Outbound Link Tracking function
linkTrack = function(e){
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

    /* Load default sports schedule */
    sports("http://www.goduke.com/rss.dbml?db_oem_id=4200&media=schedulesxml");

    // /* Start Tour */
    // $('#joyRideTipContent').joyride({
    //     'cookieMonster': true,
    //     'cookieName': 'qDukeNov29',
    // });
    showPromo();
});

function showPromo() {
    if (!$.isFunction($.cookie) || !$.cookie("PromoCookieDec21")) {
        $("#wrap").prepend("<div class='promo clearfix'><p class='left'>Welcome to the new qDuke.com!</p><p class='right'><a href='http://chron.it/SSgkeZ'>Send feedback</a>&nbsp;|&nbsp;<a href='http://old.qduke.com'>Switch back to old qDuke</a>&nbsp;|&nbsp;<a href='javascript:turnOffPromo();'>Close</a></p></div>");
        $(".promo").css({'margin-top': '-50px', opacity: 0}).transition({delay: 2000, 'margin-top':0, opacity: 1 }, 400, 'snap');
        $(".promo a").on('click', linkTrack);
    }
}

function turnOffPromo() {
    if ($.isFunction($.cookie)) {
        $.cookie("PromoCookieDec21", 'ridden', { expires: 365, domain: false });
        $(".promo").transition({'margin-top':'-50px', opacity: 0 }, 400, 'snap');
        $(".promo").remove();
    }
}