// for JSON schema design, see http://tools.ietf.org/html/draft-zyp-json-schema-03
// after designing a schema, you can somewhat test it here: http://james.newtonking.com/projects/json/schema.aspx

var configParams = [
    {
        name: 'ADMIN_USERNAME',
        description: 'New administrator username to login with from now on',
        defaultValue: 'admin',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'ADMIN_PASSWORD',
        description: 'New administrator password to login with from now on',
        defaultValue: 'chronicle',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'DOMAIN_NAME',
        description: 'Site Domain Name',
        defaultValue: 'localhost',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'DISQUS_SHORTNAME',
        description: 'Disqus Shortname',
        defaultValue: 'chronicletest',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'DISQUS_KEY',
        description: 'Disqus Key',
        defaultValue: '',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'COUCHDB_URL',
        description: 'CouchDB Server URL',
        defaultValue: 'http://chrondev:pikachu@chrondev.iriscouch.com',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'COUCHDB_DATABASE',
        description: 'CouchDB Database Name',
        defaultValue: 'dev',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'S3_BUCKET',
        description: 'Amazon S3 Bucket Name for Site Content',
        defaultValue: 'chron_dev',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'S3_KEY',
        description: 'Amazon S3 Key',
        defaultValue: '',
        schema: {
          type : "string",
          required: true
        }
    },
    {
        name: 'S3_SECRET',
        description: 'Amazon S3 Secret Key',
        defaultValue: '',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'CLOUDFRONT_DISTRIBUTION',
        description: 'Amazon CloudFront Domain Name for Site Content',
        defaultValue: 'http://d164gy67scumxg.cloudfront.net',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'S3_STATIC_BUCKET',
        description: 'Amazon S3 Bucket Name for Static Content',
        defaultValue: 'chron_static',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'CLOUDFRONT_STATIC',
        description: 'Amazon CloudFront Domain Name for Static Content',
        defaultValue: 'http://d2sug25c5hnh7r.cloudfront.net',
        schema: {
            type: "string",
            required: true
        }
    },
    {
        name: 'ASSET_PATHS',
        description: 'Paths to built and minified assets',
        defaultValue: {},
        schema: {
            type: 'object',
            required: false,
            properties: {
                css: {type: 'object'},
                js: {type: 'object'}
            }
        }
    },
    {
        name: 'REDIS_URL',
        description: 'Redis Server URL',
        defaultValue: 'redis://jodoglevy:2b258cbdcbbce003452a0ff4279d8701@barreleye.redistogo.com:9148/',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'SOLR_URL',
        description: 'Solr Server URL',
        defaultValue: 'http://index.websolr.com:80/solr/3f534ff3ff0',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'LOGGLY_SUBDOMAIN',
        description: 'Loggly Subdomain',
        schema: {
          type: "string",
          required: false
        }
    },
    {
        name: 'LOGGLY_TOKEN',
        description: 'Loggly Input Key',
        schema: {
          type: "string",
          required: false
        }
    },
    {
        name: 'TAXONOMY',
        description: 'Taxonomy tree for the site, used for categorizing articles and navigation',
        defaultValue: [
            { name: 'News',
              children:
              [ { name: 'University',
                  children:
                  [ { name: 'Academics', children: [] },
                    { name: 'Board of Trustees', children: [] },
                    { name: 'Campus Crime', children: [] },
                    { name: 'Dining', children: [] },
                    { name: 'DSG', children: [] },
                    { name: 'Graduate and Professional Schools', children: [] },
                    { name: 'Residence Life', children: [] },
                    { name: 'Student Life', children: [] } ] },
                { name: 'Local & National',
                  children:
                  [ { name: 'City of Durham', children: [] },
                    { name: 'Durham Crime', children: [] },
                    { name: 'Higher Education', children: [] },
                    { name: 'National News and Politics', children: [] },
                    { name: 'North Carolina', children: [] } ] },
                { name: 'Health & Science',
                  children:
                  [ { name: 'DUHS', children: [] },
                    { name: 'Environment & Sustainability', children: [] },
                    { name: 'Pratt', children: [] },
                    { name: 'Research', children: [] },
                    { name: 'School of Medicine', children: [] },
                    { name: 'Student Health', children: [] } ] } ] },
            { name: 'Sports',
              children:
              [ { name: 'Column', children: [] },
                { name: 'Baseball', children: [] },
                { name: 'Basketball',
                  children:
                  [ { name: 'Men', children: [] },
                    { name: 'Women', children: [] } ] },
                { name: 'Cross Country',
                  children:
                  [ { name: 'Men', children: [] },
                    { name: 'Women', children: [] } ] },
                { name: 'Fencing',
                  children:
                  [ { name: 'Men', children: [] },
                    { name: 'Women', children: [] } ] },
                { name: 'Field Hockey', children: [] },
                { name: 'Football', children: [] },
                { name: 'Golf',
                  children:
                  [ { name: 'Men', children: [] },
                    { name: 'Women', children: [] } ] },
                { name: 'Lacrosse',
                  children:
                  [ { name: 'Men', children: [] },
                    { name: 'Women', children: [] } ] },
                { name: 'Rowing', children: [] },
                { name: 'Soccer',
                  children:
                  [ { name: 'Men', children: [] },
                    { name: 'Women', children: [] } ] },
                { name: 'Swimming & Diving',
                  children:
                  [ { name: 'Men', children: [] },
                    { name: 'Women', children: [] } ] },
                { name: 'Tennis',
                  children:
                  [ { name: 'Men', children: [] },
                    { name: 'Women', children: [] } ] },
                { name: 'Track & Field',
                  children:
                  [ { name: 'Men', children: [] },
                    { name: 'Women', children: [] } ] },
                { name: 'Volleyball', children: [] },
                { name: 'Wrestling', children: [] } ] },
            { name: 'Opinion',
              children:
              [ { name: 'Letter to the Editor', children: [] },
                { name: 'Editorial Board', children: [] },
                { name: 'Column', children: [] },
                { name: 'Guest Commentary', children: [] },
                { name: 'Editor\'s Note', children: [] } ] },
            { name: 'Recess',
              children:
              [ { name: 'Page Two', children: [] },
                { name: 'Arts', children: [] },
                { name: 'Music', children: [] },
                { name: 'Film', children: [] },
                { name: 'Literature', children: [] },
                { name: 'Column', children: [] } ] },
            { name: 'Towerview',
              children:
              [ { name: 'Savvy', children: [] },
                { name: 'Prefix', children: [] },
                { name: 'Wisdom', children: [] },
                { name: 'Feature', children: [] },
                { name: 'Column', children: [] },
                { name: 'Editor\'s Note', children: [] } ] }
        ],
        schema: {
            type: 'array',
            required: true,
            id: 'taxonomyLevel',
            items: {
                type: 'object',
                properties: {
                    name: {
                        required: true,
                        type: 'string',
                    },
                    children: {'$ref': 'taxonomyLevel'},
                }
            }
        }
    },
    {
        name: 'LAYOUT_GROUPS',
        description: 'Groups used for layouts',
        defaultValue: {
            "Frontpage": {
                "namespace": [
                    "Layouts",
                    "Frontpage"
                ],
                "groups": [
                    "Top Headline",
                    "Breaking",
                    "Slideshow",
                    "Left Headlines",
                    "Right Headlines",
                    "Opinion",
                    "News",
                    "Sports",
                    "Recess",
                    "Towerview"
                ]
            },
            "News": {
                "namespace": [
                    "Layouts",
                    "News"
                ],
                "groups": [
                    "Featured",
                    "Right Headlines",
                    "Headlines",
                    "Stories"
                ]
            },
            "Sports": {
                "namespace": [
                    "Layouts",
                    "Sports"
                ],
                "groups": [
                    "Slideshow",
                    "Stories"
                ]
            },
            "Opinion": {
                "namespace": [
                    "Layouts",
                    "Opinion"
                ],
                "groups": [
                    "Featured"
                ]
            },
            "Recess": {
                "namespace": [
                    "Layouts",
                    "Recess"
                ],
                "groups": [
                    "Featured",
                    "Music",
                    "Film",
                    "Art",
                    "Stories"
                ]
            },
            "Towerview": {
                "namespace": [
                    "Layouts",
                    "Towerview"
                ],
                "groups": [
                    "Featured",
                    "Savvy",
                    "Wisdom",
                    "Editors Note",
                    "Prefix"
                ]
            },
            "Newsletter": {
                "namespace": [
                    "Layouts",
                    "Newsletter"
                ],
                "groups": [
                    "News",
                    "Sports",
                    "Opinion",
                    "Recess",
                    "Towerview"
                ]
            }
        },
        schema: {
            type: "object",
            additionalProperties: {
                type: "object",
                properties: {
                    namespace: {
                        type:"array",
                        required: true,
                        items: {type: "string"}
                    },
                    groups: {
                        type: "array",
                        required: true,
                        items: {type: "string"}
                    }
                }
            }
        }
    },
    {
        name: 'RSS_FEEDS',
        description: 'RSS feeds to check and store',
        defaultValue: [
                {
                    "title": "sportsblog",
                    "url": "http://feeds.feedburner.com/chronicleblogs/sports"
                },
                {
                    "title": "twitter-DukeChronicle",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=DukeChronicle"
                },
                {
                    "title": "twitter-ChronicleRecess",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=ChronicleRecess"
                },
                {
                    "title": "twitter-TowerviewMag",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=TowerviewMag"
                },
                {
                    "title": "twitter-DukeBasketball",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=DukeBasketball"
                },
                {
                    "title": "twitter-ChronPhoto",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=ChronPhoto"
                },
                {
                    "title": "twitter-ChronicleSports",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=ChronicleSports"
                },
                {
                    "title": "newsblog",
                    "url": "http://feeds.feedburner.com/chronicleblogs/news"
                },
                {
                    "title": "recessblog",
                    "url": "http://feeds.feedburner.com/chronicleblogs/playground"
                },
                {
                    "title": "blog-opinion",
                    "url": "http://feeds.feedburner.com/chronicleblogs/backpages"
                }
            ],
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
                title: {type: "string", required: true},
                url: {type: "string", required: true}
            }
          }
       }
    },
    {
        name: 'MAILCHIMP_API_KEY',
        description: 'MailChimp API key',
        defaultValue: '',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'MAILCHIMP_LIST_ID',
        description: 'MailChimp List ID',
        defaultValue: '21f5467afc',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'MAILCHIMP_TEMPLATE_ID',
        description: 'MailChimp Template ID',
        defaultValue: '429',
        schema: {
          type: "string",
          required: true
        }
    },
    {
        name: 'MULTIMEDIA_HTML',
        description: 'Multimedia HTML',
        defaultValue: {
            News: [
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="234" height="210"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/2012-02-08-UNC-Victory-Reactions/G0000kaMXcCK7Vi8%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/2012-02-08-UNC-Victory-Reactions/G0000kaMXcCK7Vi8%3Ffeed%3Djson" width="234" height="210" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/2012-02-08-UNC-Victory-Reactions/G0000kaMXcCK7Vi8"><img src="http://www.photoshelter.com/gal-kimg-get/G0000kaMXcCK7Vi8/s/234/210" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>',
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="234" height="210"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-24-12-BSA-March/G0000u4uM49XwTU8%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-24-12-BSA-March/G0000u4uM49XwTU8%3Ffeed%3Djson" width="234" height="210" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/1-24-12-BSA-March/G0000u4uM49XwTU8"><img src="http://www.photoshelter.com/gal-kimg-get/G0000u4uM49XwTU8/s/234/210" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>',
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="234" height="210"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-22-12-Bid-Day/G0000BzJcmYOJBtI%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-22-12-Bid-Day/G0000BzJcmYOJBtI%3Ffeed%3Djson" width="234" height="210" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/1-22-12-Bid-Day/G0000BzJcmYOJBtI"><img src="http://www.photoshelter.com/gal-kimg-get/G0000BzJcmYOJBtI/s/234/210" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>',
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="234" height="210"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/2012-01-23-29-Week-In-Photos/G0000TOQ4QojGmCY%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/2012-01-23-29-Week-In-Photos/G0000TOQ4QojGmCY%3Ffeed%3Djson" width="234" height="210" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/2012-01-23-29-Week-In-Photos/G0000TOQ4QojGmCY"><img src="http://www.photoshelter.com/gal-kimg-get/G0000TOQ4QojGmCY/s/234/210" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>'
            ],
            Sports: [
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="205" height="205"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/2012-02-08-MBB-vs-UNC/G0000RA6me3IgMhY%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/2012-02-08-MBB-vs-UNC/G0000RA6me3IgMhY%3Ffeed%3Djson" width="205" height="205" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/2012-02-08-MBB-vs-UNC/G0000RA6me3IgMhY"><img src="http://www.photoshelter.com/gal-kimg-get/G0000RA6me3IgMhY/s/205/205" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>',
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="205" height="205"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-28-12-M-Bball-vs-St-Johns/G0000ui5Y3mP4jss%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-28-12-M-Bball-vs-St-Johns/G0000ui5Y3mP4jss%3Ffeed%3Djson" width="205" height="205" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/1-28-12-M-BbOall-vs-St-Johns/G0000ui5Y3mP4jss"><img src="http://www.photoshelter.com/gal-kimg-get/G0000ui5Y3mP4jss/s/205/205" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>',
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="205" height="205"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-27-12-Cameron-Crazies-at-St-Johns/G0000OM6PZGwneyE%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-27-12-Cameron-Crazies-at-St-Johns/G0000OM6PZGwneyE%3Ffeed%3Djson" width="205" height="205" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/1-27-12-Cameron-Crazies-at-St-Johns/G0000OM6PZGwneyE"><img src="http://www.photoshelter.com/gal-kimg-get/G0000OM6PZGwneyE/s/205/205" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>'
            ],
            Recess: [
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="234" height="210"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-20-12-Cass-McCombs-Haw-River-Ballroom/G0000w4zHfu_Tg1s%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/1-20-12-Cass-McCombs-Haw-River-Ballroom/G0000w4zHfu_Tg1s%3Ffeed%3Djson" width="234" height="210" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/1-20-12-Cass-McCombs-Haw-River-Ballroom/G0000w4zHfu_Tg1s"><img src="http://www.photoshelter.com/gal-kimg-get/G0000w4zHfu_Tg1s/s/234/210" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>',
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="234" height="210"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/11-11-11-The-Sea-and-Cake-at-Local-506/G0000CBcu6wt9cEQ%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/11-11-11-The-Sea-and-Cake-at-Local-506/G0000CBcu6wt9cEQ%3Ffeed%3Djson" width="234" height="210" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/11-11-11-The-Sea-and-Cake-at-Local-506/G0000CBcu6wt9cEQ"><img src="http://www.photoshelter.com/gal-kimg-get/G0000CBcu6wt9cEQ/s/234/210" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>',
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="234" height="210"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/10-6-11-Shakori-Hills-Grassroots-Festival/G00009z37ixb7pJc%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/10-6-11-Shakori-Hills-Grassroots-Festival/G00009z37ixb7pJc%3Ffeed%3Djson" width="234" height="210" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/10-6-11-Shakori-Hills-Grassroots-Festival/G00009z37ixb7pJc"><img src="http://www.photoshelter.com/gal-kimg-get/G00009z37ixb7pJc/s/234/210" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>',
                '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="234" height="210"><param name="movie" value="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/10-6-11-Dark-Dark-Dark/G0000qK2lm8.Y61o%3Ffeed%3Djson"></param><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--[if !IE]><!--><object type="application/x-shockwave-flash" data="http://www.photoshelter.com/swf/CSlideShow.swf?feedSRC=http%3A//dukechronicle.photoshelter.com/gallery/10-6-11-Dark-Dark-Dark/G0000qK2lm8.Y61o%3Ffeed%3Djson" width="234" height="210" ><param name="wmode" value="opaque"></param><param name="allowScriptAccess" value="always"></param><param name="allowFullScreen" value="true"></param><param name="bgColor" value="#AAAAAA"></param><param name="flashvars" value="target=_self&f_l=f&f_fscr=t&f_tb=t&f_bb=f&f_bbl=f&f_fss=f&f_2up=t&f_crp=t&f_wm=t&f_s2f=t&f_emb=t&f_cap=t&f_sln=t&imgT=iptch&cred=iptc&trans=xfade&f_link=t&f_smooth=t&f_mtrx=t&tbs=5000&f_ap=t&f_up=f&btype=old&bcolor=%23CCCCCC"></param><!--<![endif]--><a href="http://dukechronicle.photoshelter.com/gallery/10-6-11-Dark-Dark-Dark/G0000qK2lm8.Y61o"><img src="http://www.photoshelter.com/gal-kimg-get/G0000qK2lm8.Y61o/s/234/210" alt="" /></a><!--[if !IE]><!--></object><!--<![endif]--></object>'
            ]
        },
        schema: {
          type: "object",
          additionalProperties: {
            type: "array",
            items: {type : "string"}
          }
       }
    },
    {
        name: 'QDUKE_ADS',
        description: 'QDUKE ADLINKS',
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
                title: {type: "string", required: true},
                url: {type: "string", required: true}
            }
          }
       }
    },
    {
        name: 'QDUKE_LINKS',
        description: 'QDUKE LINKS',
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
                title: {type: "string", required: true},
                url: {type: "string", required: true}
            }
          }
       }
    }
];

exports.getParameters = function() {
    return configParams;
};
