define(["jquery", "jquery-ui"], function($) {
    var nextPageToLoad = 2; // keeps track fo what page to load next
    var isLoadingPage = false; // stops multiple pages loading at once
    var noPagesLeftToLoad = false; // stops ajax requests from being issued once all articles for this search have been loaded
    var loadImage = null;

    $(document).ready(function() {
        loadImage = $("#loadImage");
        loadImage.hide();
    });

    $(window).scroll(function(){
       // if they scrolled to the bottom of the page, load the next 'page' of articles
       if(!isLoadingPage && !noPagesLeftToLoad && $(window).scrollTop() === ($(document).height() - $(window).height())) {
            loadImage.fadeIn('slow');
            isLoadingPage = true;

            // use our api to load the next search page for this set of params
            $.get("/api/"+scrollLoadUrl+"&page="+nextPageToLoad, function(returnedData) {
                if(returnedData.docs.length === 0) {
                    noPagesLeftToLoad = true;
                    loadImage.fadeOut();
                }
                else {
                    // add the docs to the search page, correctly formatted
                    addArticle(returnedData.docs,0);
                }
            });
        }
    });

    function addArticle(articles,i) {
        if(i < articles.length) {
            // add and fade in the article, then when fade in done add next article
            var HTMLToAdd = formatArticle(articles[i]);
            loadImage.before(HTMLToAdd)
            $(".addedArticle:last").hide();
            $(".addedArticle:last").fadeIn(function () {
                addArticle(articles,i+1);
            });
        }
        else {
            // no more articles to add
            nextPageToLoad ++;
            loadImage.fadeOut(function () {
                isLoadingPage = false;
            });
        }
    }

    function formatArticle(article) {
        var addHTML = searchboxHTML;
        addHTML = addHTML.replace("URL_REPLACE",article.urls[0]);
        addHTML = addHTML.replace("HEADER_REPLACE",article.title);
        addHTML = addHTML.replace("DATE_REPLACE", $.datepicker.formatDate("MM d, yy", new Date(article.created*1000)));
        addHTML = addHTML.replace("AUTHOR_REPLACE",article.authors.join(", "));
        addHTML = addHTML.replace("TEASER_REPLACE",article.teaser);

        return addHTML;
    }


});