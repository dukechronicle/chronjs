var scrollLoadPage, scrollLoadLastDoc;

define(["jquery", "libs/jquery-ui"], function($) {
    var isLoadingPage = false; // stops multiple pages loading at once
    var noPagesLeftToLoad = false; // stops ajax requests from being issued once all articles for this page have been loaded
    var loadImage = null;
    var scrollLoadUrl, nextPageToLoad;
    

    scrollLoadPage = function(_scrollLoadUrl, _nextPageToLoad) {
        scrollLoadUrl = _scrollLoadUrl;
        nextPageToLoad = _nextPageToLoad;
        scrollLoad(loadPaginatedData);
    };

    scrollLoadLastDoc = function(_scrollLoadUrl) {
        scrollLoadUrl = _scrollLoadUrl;
        scrollLoad(loadDataFromLastDoc);
    };

    function scrollLoad(documentLoad) {
        $(document).ready(function() {
            loadImage = $("#loadImage");
            loadImage.hide();
        });

        $(window).scroll(function(){
            // if they scrolled to the bottom of the page, load the next 'page' of articles
            if (!isLoadingPage && !noPagesLeftToLoad && bottomOfPage()) {
                loadImage.fadeIn('slow');
                isLoadingPage = true;
                documentLoad();
            }
        });
    }

    function bottomOfPage () {
        return $(window).scrollTop() == ($(document).height()-$(window).height())
    }

    // load the next page of documents for this set of params
    function loadPaginatedData() {
        $.get("/api/"+scrollLoadUrl+"&page="+nextPageToLoad, function(returnedData) {
            if(returnedData.docs.length === 0) {
                noPagesLeftToLoad = true;
                loadImage.fadeOut();
            }
            else {
                nextPageToLoad ++;

                // add the docs to this page, correctly formatted
                addArticle(returnedData.docs,0);
            }
        });
    }

    // load the next set of documents for this set of params, starting with the last document currently on the page
       function loadDataFromLastDoc() {
        var next = $(".result:last").attr('data-key');

        if (!next || !JSON.parse(next)) {
            noPagesLeftToLoad = true;
            loadImage.fadeOut();
        }
        else {
            $.get(scrollLoadUrl, {key: next}, function (result) {
                if (result.docs.length == 1) {
                    noPagesLeftToLoad = true;
                    loadImage.fadeOut();
                }
                else {
                    // add the docs to the page, correctly formatted,
                    // ignoring the duplicate doc
                    addArticle(result.docs);
                    $(".result:last").attr('data-key', result.next);
                }
            });
        }
    }

    function addArticle(articles) {
        if (articles.length > 0) {
            // add and fade in the article, then when fade in done add next
            // article

            var model = $(".result:first");
            var article = formatArticle(model.clone(), articles.shift());
            loadImage.before(article);
            article.hide();
            article.fadeIn(function () {
                addArticle(articles);
            });
        }
        else {
            // no more articles to add
            loadImage.fadeOut(function () {
                isLoadingPage = false;
            });
        }
    }

    function formatArticle(document, article) {
        var date = new Date(article.created * 1000);
        
        document.attr("href", '/article/'+article.urls[article.urls.length - 1]);
        document.find(".title").html(article.title);
        document.find(".date").html($.datepicker.formatDate("MM d, yy", date));
        document.find(".teaser").html(article.teaser);
        document.find(".author").html(article.authors.join(", "));

        return document;
    }

});
