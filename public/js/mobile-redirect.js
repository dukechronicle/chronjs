var MOBILE_BROWSER_USER_AGENTS = ["Android", "iPhone", "Windows Phone",
                                  "Blackberry", "Symbian", "Palm", "webOS"];

var userAgent = navigator.userAgent || "";

for(var i in MOBILE_BROWSER_USER_AGENTS) {
    if(userAgent.indexOf(MOBILE_BROWSER_USER_AGENTS[i]) != -1 && getCookie('forceFullSite') != "true") {
        window.location='/m' + window.location.pathname;
    }
}

function getCookie(c_name) {
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++) {
        x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
        y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,"");
        if (x==c_name) {
            return unescape(y);
        }
    }
}
