var CHRONICLE_DOMAIN = 'http://www.dukechronicle.com';

var ERROR_PAGE = "#ErrorPage";
var ARTICLE_LIST_PAGE = "#ArticleListPage";
var ARTICLE_PAGE = "#ArticlePage";

var ARTICLE_LIST = "#ArticleList";
var ARTICLE_CONTENT = "#ArticleContent";
var HEADER_TITLE = "#HeaderTitle";
var ERROR_MESSAGE = "#ErrorMessage";
var UNKNOWN_ERROR = "An unknown error has occured, click back to return to the previous page.";
var ARTICLE_NOT_FOUND = "The article cannot be found. Hit back to return to the previous page.";

// Last Section DocID
var lastDocID = [];

// Cache the list of articles. Emphemeral.
var articleListCache = [];

// Cache life = 100 seconds
var ARTICLE_LIST_CACHE_TIMEOUT = 100000;

// Cache the articles. Shouldn't be cleared.
var articleCache = [];

function showFullSite() {
    _gaq.push(['_trackEvent', 'Mobile', 'OptOut']);
    setCookie("forceFullSite", "true", 1, '/', 'dukechronicle.com');
    window.location = "http://www.dukechronicle.com";
}

function setCookie(c_name, value, exdays, path, domain) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var cookie = c_name + '=' + escape(value);
    cookie += exdays ? '; expires=' + exdate.toUTCString() : '';
    cookie += path ? '; path=' + path : '';
    cookie += domain ? '; domain=' + domain : '';
    document.cookie = cookie;
}

function getDateString(time)
{
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var date = new Date(time*1000);
    var month = MONTHS[date.getMonth()];
    var day = date.getDate();
    var year= date.getFullYear();
    var dateString = month + " "+ day + ", " + year;
    
    return dateString;
}

function generateListItem(articleJSON)
{
    var article = articleJSON;
        
    // Containers
    var listItem = $('<li />');

    // Hyperlink
    article.url = article.urls[article.urls.length - 1];
    var hyperlink = $('<a />',{ "href":"javascript:getArticle('" + article.url+ "')"});

    // Thumbnail
    // hyperlink.append('<img src="' + 'img/test.png"' + ' "class"="ui-li-thumb" />');

    // Article Title
    hyperlink.append($('<h2 />').html(article.title));

    // Article Date
    hyperlink.append($('<h3 />').html(article.authors.join(', ')));

    // Article Synopsis
    hyperlink.append($('<p />').html(article.teaser));

    return listItem.append(hyperlink);
}

function updateArticleList(responseText, articleListContainer, category)
{
    var articleListResponse = responseText;
    $(HEADER_TITLE).text(category);

    if(articleListResponse == null)
    {
        $.mobile.changePage(ERROR_PAGE, 'slide');
        return;
    }

    $(ARTICLE_LIST).empty();

    var lastDate = "";
    for(var i in articleListResponse)
    {
        curDate = getDateString(articleListResponse[i].created)
        if (lastDate != curDate) {
            $(ARTICLE_LIST).append("<li data-role='list-divider'>" + curDate + "</li>");
            lastDate = curDate;
        }
        $(ARTICLE_LIST).append(generateListItem(articleListResponse[i]));
        lastDocID[category] = articleListResponse[i]._id;
    }

    $(ARTICLE_LIST).listview('refresh');
}

function getArticleList(category, title, forced)
{
    // Clear search box.
    $('#searchInput').val("");
    // Retrieve if cache miss, forced reload, or if cache is too old:
    if(articleListCache[category] == null || forced || new Date().getTime() - articleListCache[category].timestamp > ARTICLE_LIST_CACHE_TIMEOUT)
    {
        var url = "/api/all";
        if(category.toLowerCase() != 'all') url = "/api/section/" + category;
        
        if(lastDocID[category] != null)
        {
            url += "/" + lastDocID[category];
        }
        //console.log(url);
        $.ajax({
            url: CHRONICLE_DOMAIN + url,
            cache: false,
            dataType: "jsonp",
            success: function(data){
                //console.log(category);
                if(!data) {
                    $.mobile.changePage(ERROR_PAGE, 'none');
                    return;
                }
                // Insert into cache
                articleListCache[category] = {timestamp: new Date().getTime(), data: data};
                updateArticleList(articleListCache[category].data.docs, $(this), title);
            },
            error: function (jqXHR, textStatus, ERROR_MESSAGEThrown) {
                handleAJAXError(jqXHR);
            } 

        });
    } 
    else {
        updateArticleList(articleListCache[category].data.docs, $(this), title);
    }
}

function generateArticle(articleJSON)
{
    var article = articleJSON;
    
    if(article == null)
    {
        $.mobile.changePage(ERROR_PAGE, 'slide');
        return;
    }
    
    var totalString = $('<div />');
    totalString.append($('<h1 />').append(article.title));

    totalString.append($('<p />', {"class": "author"}).append("By " + article.authors.join(", ") + " | " + getDateString(article.created)));

    if (article.images != null && article.images.LargeRect != null) {
        var imageString = $('<img class="article-image" src='+article.images.LargeRect.url + ' alt="chronicle image"/>');
              totalString.append(imageString);
    }
    totalString.append($('<p />').append(article.renderedBody));
    loadDisqusForArticle(true, 'dukechronicle', article._id, article.title, article.urls[0]);

    return totalString;
}

function handleAJAXError(jqXHR)
{
    if(jqXHR.status == 500)
    {
        $(ERROR_MESSAGE).text(ARTICLE_NOT_FOUND);
    }
    else
    {
        $(ERROR_MESSAGE).text(UNKNOWN_ERROR);
    }
    $.mobile.changePage(ERROR_PAGE, 'slide');
}

function getArticle(articleURL)
{
    // Retrieve if cache miss, forced reload, or if cache is too old:
    if(articleCache[articleURL] == null)
    {
        //console.log("article cache: cachemiss");
        $.ajax({
            url: CHRONICLE_DOMAIN + "/api/article/url/" + articleURL,
            dataType: "jsonp",
            cache: false,
            success: function(data){
                if(!data) {
                    //console.log("get article failed");
                    $.mobile.changePage(ERROR_PAGE, 'slide');
                    return;
                }

                // Insert into cache
                articleCache[articleURL] = data;
                $(ARTICLE_CONTENT).empty();
                $(ARTICLE_CONTENT).html(generateArticle(articleCache[articleURL]));
                $.mobile.changePage($(ARTICLE_PAGE),{transition:"slide", dataUrl:"/article/"+articleURL});
                
            },
            error: function (jqXHR, textStatus, errorThrown) {
                handleAJAXError(jqXHR);
            }  
        });
    }
    else {
        $(ARTICLE_CONTENT).empty();
        $(ARTICLE_CONTENT).html(generateArticle(articleCache[articleURL]));
        $.mobile.changePage($(ARTICLE_PAGE),{transition:"slide", dataUrl:"/article/"+articleURL});
    } 
}

function initMobileOptions()
{
    $(document).bind("mobileinit", function() {
      $.mobile.page.prototype.options.addBackBtn = true;
      $.mobile.page.prototype.options.backBtnText = "Prev";
      $.mobile.page.prototype.options.backBtnTheme = "a";
      $.mobile.loader.prototype.options.text = "loading";
      $.mobile.loader.prototype.options.textVisible = false;
      $.mobile.loader.prototype.options.theme = "a";
      $.mobile.loader.prototype.options.html = "";
      $.mobile.pushStateEnabled = false;
      //$.mobile.touchOverflowEnabled = true;
      });
}

function beginMobile()
{
    // on Document Ready parse URL
      $(function() {
          var relativeURL = window.location.pathname;
          var splitString = relativeURL.split("/");
          // TODO: malformed input?
          if(splitString[1] == "article" && splitString[2] != null && splitString[2] != "")
          {
             getArticle(splitString[2]);
          }
          var sections = ['news', 'sports', 'opinion', 'recess', 'towerview'];
          if(sections.indexOf(splitString[1]) !== -1) {
              getArticleList(splitString[1], 'The Chronicle', true);
          }
          else {
              getArticleList('all', 'The Chronicle', true);
          }

          $("#searchBox").submit(search);
      });
}

function search(eventObject)
{
    eventObject.preventDefault();

    var rawQuery = $("#searchInput").val();
    var query = rawQuery.replace(/\s+/g , "-");

    if(query.length > 0) {
        $.ajax({
            url: CHRONICLE_DOMAIN + "/api/search?q=" + query,
            dataType: "jsonp",
            cache: false,
            success: function(data) {
                if(!data) {
                    $.mobile.changePage(ERROR_PAGE, 'slide');
                    return;
                }
                updateArticleList(data.docs, $(this), "Search Results");
            },
            error: function (jqXHR, textStatus, errorThrown) {
                handleAJAXError(jqXHR);
            }  
        });
    }

    return false;
}






// Google Analytics Code for Mobile
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-5900287-12']);
(function() {
var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
$('[data-role=page]').live('pageshow', function (event, ui) {
try {
hash = location.hash;
if (hash && hash.length > 1) {
_gaq.push(['_trackPageview', hash.substr(1)]);
} else {
_gaq.push(['_trackPageview']);
}
} catch(err) {
}
});
