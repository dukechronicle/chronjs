var ARTICLE_LIST = "#ARTICLE_LIST";
var ARTICLE_CONTENT = "#ARTICLE_CONTENT";
var HEADER_TITLE = "#HEADER_TITLE";
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
        
function getDateString(time)
{
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var date = new Date(time);
    var month = MONTHS[date.getMonth()];
    var day = date.getDate();
    var year= date.getFullYear();
    var dateString = " - " + month + " "+ day + ", " + year;
    
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

    var dateString = getDateString(article.created*1000);
	// Article Title
	hyperlink.append($('<h2 />').html(article.title));

    // Article Date
    hyperlink.append($('<h3 />').html(dateString));

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
        $.mobile.changePage('#error', 'slide');
        return;
    }

	$(ARTICLE_LIST).empty();

    for(var i in articleListResponse)
    {
        $(ARTICLE_LIST).append(generateListItem(articleListResponse[i]));
        lastDocID[category] = articleListResponse[i]._id;
    }

	$(ARTICLE_LIST).listview('refresh');
}

function getArticleList(category, title, forced)
{
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
            url: url,
            cache: false,
            dataType: "jsonp",
            success: function(data){
                //console.log(category);
                if(!data) {
                    $.mobile.changePage('#error', 'none');
                    return;
                }
                // Insert into cache
                articleListCache[category] = {timestamp: new Date().getTime(), data: data};
                updateArticleList(articleListCache[category].data, $(this), title);
            },
            error: function (jqXHR, textStatus, ERROR_MESSAGEThrown) {
                handleAJAXError(jqXHR);
            } 

        });
    } 
	else {
        updateArticleList(articleListCache[category].data, $(this), title);
    }
}

function generateArticle(articleJSON)
{
    var article = articleJSON;
    
    if(article == null)
    {
        $.mobile.changePage('#error', 'slide');
        return;
    }
    
	var totalString = $('<div />');
	totalString.append($('<h2 />').append(article.title));

    for(author in article.authors)
    {
        var authorString = $('<p />', {"class": "author"}).append(article.authors[author]);
		totalString.append(authorString);
    }

    if (article.images != null && article.images.LargeRect != null) {
        var imageString = $('<img src='+article.images.LargeRect.url + ' alt="chronicle image"/>');
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
    $.mobile.changePage('#error', 'slide');
}

function getArticle(articleURL)
{
    // Retrieve if cache miss, forced reload, or if cache is too old:
    if(articleCache[articleURL] == null)
    {
        //console.log("article cache: cachemiss");
        $.ajax({
            url: "/api/article/url/" + articleURL,
            dataType: "jsonp",
            cache: false,
            success: function(data){
                if(!data) {
                    //console.log("get article failed");
                    $.mobile.changePage('#error', 'slide');
                    return;
                }

                // Insert into cache
                articleCache[articleURL] = {data: data};
                $(ARTICLE_CONTENT).empty();
                $(ARTICLE_CONTENT).html(generateArticle(articleCache[articleURL].data));
 				$.mobile.changePage($("#Article"),{transition:"slide", dataUrl:"/m/article/"+articleURL});
                
            },
            error: function (jqXHR, textStatus, errorThrown) {
                handleAJAXError(jqXHR);
            }  
        });
    }
	else {
        $(ARTICLE_CONTENT).empty();
        $(ARTICLE_CONTENT).html(generateArticle(articleCache[articleURL].data));
			$.mobile.changePage($("#Article"),{transition:"slide", dataUrl:"/m/article/"+articleURL});
    } 
}
     

function getSectionList()
{
	$(ARTICLE_LIST).empty();
	$(HEADER_TITLE).text("The Chronicle");

    // Containers
    var categories = ["News", "Sports", "Opinion", "Recess", "Towerview"];
    for(var i in categories)
    {
	    var listItem = $('<li />');
	    hyperlink = $('<a />',{ "href":"javascript:getArticleList('" + categories[i] + "','" + categories[i] +"')"});
        hyperlink.append($('<h4 />').text(categories[i]));
        listItem.append(hyperlink);
        $(ARTICLE_LIST).append(listItem);
    }   

	$(ARTICLE_LIST).listview('refresh');
    $.mobile.silentScroll(0);
}

function initMobileOptions()
{
    $(document).bind("mobileinit", function() {
      $.mobile.page.prototype.options.addBackBtn = true;
      $.mobile.page.prototype.options.backBtnText = "Prev";
      $.mobile.page.prototype.options.backBtnTheme = "a";
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
          getArticleList('all', 'The Chronicle', true);
          if(splitString[2] == "article" && splitString[3] != null && splitString[3] != "")
          {
             getArticle(splitString[3]);
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
            url: "/api/search/" + query,
            dataType: "jsonp",
            cache: false,
            success: function(data) {
                if(!data) {
                    $.mobile.changePage('#error', 'slide');
                    return;
                }
                
                updateArticleList(data.docs, $(this), "Search Results for '" + rawQuery + "'");
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
