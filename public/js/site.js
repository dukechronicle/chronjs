// highlight selected page
$(function() {
    var currentPage = document.location.href.split("/")[3];

    var pages = ["news", "sports", "opinion", "recess", "towerview"];
    console.log(pages.indexOf(currentPage));
    if (pages.indexOf(currentPage)!==-1) {
        $("#nav h2:nth-child(" + pages.indexOf(currentPage) + ") a").addClass("active").click(function(e)           {e.preventDefault()});
    }
})