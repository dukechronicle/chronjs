var MOBILE_BROWSER_USER_AGENTS = ["Android", "iPhone", "Windows Phone",
                                  "Blackberry", "Symbian", "Palm", "webOS"];

var userAgent = navigator.userAgent || "";

for(var i in MOBILE_BROWSER_USER_AGENTS) {
    if(userAgent.indexOf(MOBILE_BROWSER_USER_AGENTS[i]) != -1) {
        window.location='/m' + window.location.pathname;
    }
}
