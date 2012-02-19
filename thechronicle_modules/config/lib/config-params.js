var configParams = [
    {
        name: 'ADMIN_USERNAME',
        description: 'New administrator username to login with from now on',
        defaultValue: 'admin'
    },
    {
        name: 'ADMIN_PASSWORD',
        description: 'New administrator password to login with from now on',
        defaultValue: 'chronicle'
    },
    {
        name: 'DISQUS_SHORTNAME',
        description: 'Disqus Shortname',
        defaultValue: 'chronicletest'
    },
    {
        name: 'COUCHDB_URL',
        description: 'CouchDB Server URL',
        defaultValue: 'http://chrondev:pikachu@chrondev.iriscouch.com'
    },
    {
        name: 'COUCHDB_DATABASE',
        description: 'CouchDB Database Name',
        defaultValue: 'dev'
    },
    {
        name: 'S3_BUCKET',
        description: 'Amazon S3 Bucket Name',
        defaultValue: 'chron_dev'
    },
    {
        name: 'S3_KEY',
        description: 'Amazon S3 Key',
        defaultValue: ''
    },
    {
        name: 'S3_SECRET',
        description: 'Amazon S3 Secret Key',
        defaultValue: ''
    },
    {
        name: 'CLOUDFRONT_DISTRIBUTION',
        description: 'Amazon CloudFront Domain Name',
        defaultValue: 'http://d164gy67scumxg.cloudfront.net'
    },
    {
        name: 'REDIS_URL',
        description: 'Redis Server URL',
        defaultValue: 'redis://jodoglevy:2b258cbdcbbce003452a0ff4279d8701@barreleye.redistogo.com:9148/'
    },
    {
        name: 'SOLR_HOST',
        description: 'WebSolr Server URL',
        defaultValue: 'index.websolr.com'
    },
    {
        name: 'SOLR_PORT',
        description: 'WebSolr Server Port',
        defaultValue: '80'
    },
    {
        name: 'SOLR_CORE',
        description: 'WebSolr Core',
        defaultValue: '/3f534ff3ff0'
    },
    {
        name: 'SOLR_PATH',
        description: 'WebSolr Server Path',
        defaultValue: '/solr'
    },
    {
        name: 'TAXONOMY_MAIN_SECTIONS',
        description: 'Main sections of the taxonomy',
        defaultValue: [
            "News",
            "Sports",
            "Opinion",
            "Recess",
            "Towerview"
        ]
    },
    {
        name: 'TAXONOMY',
        description: 'Taxonomy tree for the site, used for categorizing articles and navigation',
        defaultValue: [
	        {
		        "News": [
			        {
				        "University": [
					        {
						        "Academics": []
					        },
					        {
						        "Board of Trustees": []
					        },
					        {
						        "Campus Crime": []
					        },
					        {
						        "Dining": []
					        },
					        {
						        "DSG": []
					        },
					        {
						        "Graduate and Professional Schools": []
					        },
					        {
						        "Residence Life": []
					        },
					        {
						        "Student Life": []
					        }
				        ]
			        },
			        {
				        "Local & National": [
					        {
						        "City of Durham": []
					        },
					        {
						        "Durham Crime": []
					        },
					        {
						        "Higher Education": []
					        },
					        {
						        "National News and Politics": []
					        },
					        {
						        "North Carolina": []
					        }
				        ]
			        },
			        {
				        "Health & Science": [
					        {
						        "DUHS": []
					        },
					        {
						        "Environment & Sustainability": []
					        },
					        {
						        "Pratt": []
					        },
					        {
						        "Research": []
					        },
					        {
						        "School of Medicine": []
					        },
					        {
						        "Student Health": []
					        }
				        ]
			        }
		        ]
	        },
	        {
		        "Sports": [
			        {
				        "Men": [
					        {
						        "Baseball": []
					        },
					        {
						        "Basketball": []
					        },
					        {
						        "Cross country": []
					        },
					        {
						        "Fencing": []
					        },
					        {
						        "Football": []
					        },
					        {
						        "Golf": []
					        },
					        {
						        "Lacrosse": []
					        },
					        {
						        "Soccer": []
					        },
					        {
						        "Swimming and diving": []
					        },
					        {
						        "Tennis": []
					        },
					        {
						        "Track and field": []
					        },
					        {
						        "Wrestling": []
					        }
				        ]
			        },
			        {
				        "Women": [
					        {
						        "Basketball": []
					        },
					        {
						        "Cross country": []
					        },
					        {
						        "Fencing": []
					        },
					        {
						        "Field hockey": []
					        },
					        {
						        "Golf": []
					        },
					        {
						        "Lacrosse": []
					        },
					        {
						        "Rowing": []
					        },
					        {
						        "Soccer": []
					        },
					        {
						        "Swimming and diving": []
					        },
					        {
						        "Tennis": []
					        },
					        {
						        "Track and field": []
					        },
					        {
						        "Volleyball": []
					        }
				        ]
			        }
		        ]
	        },
	        {
		        "Opinion": [
			        {
				        "Letter to the Editor": []
			        },
			        {
				        "Editorial Board": []
			        },
			        {
				        "Column": []
			        },
			        {
				        "Guest Commentary": []
			        },
			        {
				        "Editor's Note": []
			        }
		        ]
	        },
	        {
		        "Recess": [
			        {
				        "Page Two": []
			        },
			        {
				        "Arts": []
			        },
			        {
				        "Music": []
			        },
			        {
				        "Film": []
			        },
			        {
				        "Literature": []
			        }
		        ]
	        },
	        {
		        "Towerview": []
	        }
        ]
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
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=dukebasketball"
                },
                {
                    "title": "twitter-ChronPhoto",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=ChronPhoto"
                },
                {
                    "title": "twitter-ChronicleSports",
                    "url": "http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=chroniclesports"
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
            ]
    },
    {
        name: 'MAILCHIMP_API_KEY',
        description: 'MailChimp API key',
        defaultValue: ''
    },
    {
        name: 'MAILCHIMP_LIST_ID',
        description: 'MailChimp List ID',
        defaultValue: '21f5467afc'
    },
    {
        name: 'MAILCHIMP_TEMPLATE_ID',
        description: 'MailChimp Template ID',
        defaultValue: '429'
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
        }
    }
];

exports.getParameters = function() {
    return configParams;
};
