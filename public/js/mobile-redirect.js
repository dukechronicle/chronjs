(function () {
    var SITE_SUBDOMAIN = 'www';
    var MOBILE_SUBDOMAIN = 'm';
    var MOBILE_USER_AGENTS = [
        'Android', 'iPhone', 'Windows Phone', 'Blackberry', 'Symbian', 'Palm',
        'webOS',
    ];


    if (isMobileUser() && getCookie('forceFullSite') != 'true') {
        var href = window.location.href.replace(
            SITE_SUBDOMAIN, MOBILE_SUBDOMAIN);
        window.location.replace(href);
    }

    function isMobileUser() {
        var userAgent = navigator.userAgent;
        var mobilePattern = new RegExp(MOBILE_USER_AGENTS.join('|'), 'i');
        return userAgent && userAgent.match(mobilePattern);
    }

    function getCookie(c_name) {
        var i,x,y,ARRcookies=document.cookie.split(';');
        for (i=0;i<ARRcookies.length;i++) {
            x=ARRcookies[i].substr(0,ARRcookies[i].indexOf('='));
            y=ARRcookies[i].substr(ARRcookies[i].indexOf('=')+1);
            x=x.replace(/^\s+|\s+$/g,'');
            if (x==c_name) {
                return unescape(y);
            }
        }
    }
})();
