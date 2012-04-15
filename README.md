### Install g++

    $ sudo apt-get install g++

### Install NodeJS and NPM

    https://github.com/joyent/node/wiki/Installation

### Set NodeJS to run at version 0.4.12

Install NVM: https://github.com/creationix/nvm
    
Then:

    $ nvm install v0.4.12

    $ nvm use v0.4.12

### Install imagemagick

    $ sudo apt-get install imagemagick

### Clone this repository on to hard drive

    $ git clone git@github.com:thechronicle/website.git

### Install dependencies specified in package.json

    $ cd website

    $ npm install

### Set Environment Variables

In order to retrieve configuration info for the sever to use, you must specify the CouchDB Host URL that does or will hold the configuation profiles for the site, as well as the configuration profile to use.

    $ export CHRONICLE_CONFIG_DB=https://username:password@couchdbhost

    $ export CHRONICLE_CONFIG_PROFILE=dev

You should also specify a port for the site to run on. If no port is specified, the site by default listens on port 4000

    $ export CHRONICLE_PORT=80

If this is the production version of the site, you must specify this so that production specific settings are used (ex: aserje caching / bundling, cron jobs, off site logging). If this is not meant to be the production version of the site, you should skip this.

    $ export NODE_ENV=production

In addition, for production off site logging to work, you must specify some Loggly parameters. If this is not meant to be the production version of the site, or you do not want off site logging, you should skip this.

    $ export CHRONICLE_LOGGLY_SUBDOMAIN=thechronicle
    
    $ export CHRONICLE_LOGGLY_TOKEN=your-token

You will most likely want to add the above export lines to the end of your ~/.bashrc file so that these environment variables are available at all times.

### Start server

    $ node server.js

server will be started on port 4000, you should be able to access the site at

    http://localhost:4000

### Set Chronicle configuration settings

Navigate to http://localhost:4000 and fill out all fields of the configuration form you are presented with. This page only shows up when your chronicle environment has undefined configuration settings. After you set your config settings, the site will work as normal.

To change config settings after you have initially set them, go to http://localhost:4000/config and edit the settings.

### S3 key and secret - config properties

All configuration properties have a default value currently except MailChimpAPI Key, S3 Key and S3 Secret due to their secure nature. To find the Key and Secret for your S3 environment, go to: https://aws-portal.amazon.com/gp/aws/developer/account/index.html?action=access-key

### Adding your own configuration properties

As you continue to extend the Chronicle framework, you may find that defining some configuration globals would be useful. To add a configuration parameter to appear in the initial configuration set up web page, navigate to /thechronicle_modules/config/lib/config-params.js and add your new configuration parameter (name, description, and default value [if the param is a string with no default value use '', if it is an object with no default use {} ]) to the configParams object. Then restart the server and go to localhost:4000/ to define a value for your new configuration option.

### Accessing configuration properties

In the code, you can access global configuration settings by:

    var config = require('./thechronicle_modules/config');

    param_value = config.get('param_name');

Remember that config properties could change during runtime if someone changes settings at http://localhost:4000/config, so you should always access config properties directly via config.get() rather than a global variable within your file that called config.get at file start.

### Default Admin username and password

You will need the admin username and password to change configuration settings (including setting the new admin username and password), as well ad administrating the site. Currently, the default admin username is 'admin' and the default admin password is 'chronicle'. These should be changed to more secure strings when you initially set the configuration settings.
