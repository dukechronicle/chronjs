define(["jquery", "libs/jquery-ui"], function($) {

    var isLoadingPage = false; // stops multiple pages loading at once
    var noPagesLeftToLoad = false; // stops ajax requests from being issued once all articles for this page have been loaded
    var loadImage = null;

    return { "infinite-scroll": scrollLoad }


    function scrollLoad() {
        loadImage = $("#loadImage");
        loadImage.hide();
        var scrollLoadUrl = loadImage.data('url');

        $(window).scroll(function(){
            // if they scrolled to the bottom of the page, load the next 'page' of articles
            if (!isLoadingPage && !noPagesLeftToLoad && bottomOfPage()) {
                loadImage.fadeIn('slow');
                isLoadingPage = true;
                loadDocuments(scrollLoadUrl);
            }
        });
    }

    function bottomOfPage () {
        return $(window).scrollTop() ==
            ($(document).height() - $(window).height());
    }

    function loadDocuments(scrollLoadUrl) {
        var next = loadImage.attr('data-key');

        if (!next || !JSON.parse(next)) {
            noPagesLeftToLoad = true;
            loadImage.fadeOut();
        }
        else {
            $.get(scrollLoadUrl, {start: next}, function (result) {
                if (result.docs.length == 0) {
                    noPagesLeftToLoad = true;
                    loadImage.fadeOut();
                }
                else {
                    // add the docs to the page, correctly formatted,
                    // ignoring the duplicate doc
                    addArticle(result.docs);
                    loadImage.attr('data-key', result.next);
                }
            });
        }
    }

    function addArticle(articles) {
        if (articles.length > 0) {
            // add and fade in the article, then when fade in done add next
            // article

            var model = $(".document:first");
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
        var url = article.urls[article.urls.length - 1];
        
        document.find("a.url").attr("href", '/article/' + url);
        document.find(".title").html(article.title);
        document.find(".date").html($.datepicker.formatDate("MM d, yy", date));
        document.find(".teaser").html(article.teaser);
        document.find(".author").html(article.authors.join(", "));

        return document;
    }

});
