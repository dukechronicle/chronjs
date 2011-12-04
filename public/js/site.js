
// highlight selected page
$(function() {
    var currentPage = document.location.href.split("/")[3];

    if (currentPage === 'section') {
        currentPage = document.location.href.split("/")[4].toLowerCase();
    }

    var pages = ["news", "sports", "opinion", "recess", "towerview"];
    if (pages.indexOf(currentPage)!==-1) {
        var index = pages.indexOf(currentPage) + 1;
        $("#nav h2:nth-child(" + index + ") a").addClass("active");
        //click(function(e) {e.preventDefault()})
    }
})