/**
 * @preserve Galleria Classic Theme 2011-08-01
 * http://galleria.aino.se
 *
 * Copyright (c) 2011, Aino
 * Licensed under the MIT license.
 */

/*global jQuery, Galleria */

Galleria.requires(1.25, 'This version of Classic theme requires Galleria 1.2.5 or later');

(function($) {

Galleria.addTheme({
    name: 'frontpage-slideshow',
    author: 'Galleria',
    css: 'galleria.frontpage-slideshow.css',

    defaults: {
        autoplay: true,
        pauseOnInteraction: true,
        transition: 'slide',
        transitionSpeed: 500,
        thumbCrop:  'height',
        thumbnails: false,
        // set this to false if you want to show the caption all the time:
        _toggleInfo: false
    },
    init: function(options) {
        var _this = this;
        // add some elements
        this.addElement('dots');
        this.append({
            'container' : ['dots']
        });

        // cache some stuff
        var info = this.$('info-link,info-close,info-text'),
            touch = Galleria.TOUCH,
            click = touch ? 'touchstart' : 'click';

        // show loader & counter with opacity
        this.$('loader,counter').show().css('opacity', 0.4);

        var dotClickFn = function (d) {
                return $("<div>").click(function (d) {
                    return function (a) {
                        a.preventDefault();
                        _this.show(d)
                    }
                }(d))
            };
        for (var i = 0; i < this.getDataLength(); i++) this.$("dots").append(dotClickFn(i));
        var dotsWidth = this.$("dots").outerWidth();

        // some stuff for non-touch browsers
        if (! touch ) {
            this.addIdleState( this.get('image-nav-left'), { left:-50 });
            this.addIdleState( this.get('image-nav-right'), { right:-50 });
            this.addIdleState( this.get('counter'), { opacity:0 });
        }

        // toggle info
        if ( options._toggleInfo === true ) {
            info.bind( click, function() {
                info.toggle();
            });
        } else {
            info.show();
            this.$('info-link, info-close').hide();
        }

        this.bind('loadstart', function(e) {
            if (!e.cached) {
                this.$('loader').show().fadeTo(200, 0.4);
            }

            this.$('info').toggle( this.hasInfo() );

            $(e.thumbTarget).css('opacity',1).parent().siblings().children().css('opacity', 0.6);
        });

        this.bind('loadfinish', function(e) {
            this.$('loader').fadeOut(200);
            this.$("dots").children("div").eq(e.index).addClass("active").siblings(".active").removeClass("active");
        });
    }
});

}(jQuery));
