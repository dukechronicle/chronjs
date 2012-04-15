window.fbAsyncInit = function() {
    FB.init({
        appId      : '335954613131615', // App ID
        //channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html', // Channel File
        status     : false, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
    });
    // subscribe to like button
    FB.Event.subscribe('edge.create', function(targetUrl) {
        alert("test");
        _gaq.push(['_trackSocial', 'facebook', 'like', targetUrl]);
    });
};

// Load the SDK Asynchronously
(function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
js = d.createElement('script'); js.id = id; js.async = true;
js.src = "//connect.facebook.net/en_US/all.js";
ref.parentNode.insertBefore(js, ref);
}(document));
