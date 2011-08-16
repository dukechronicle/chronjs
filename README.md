### Install NodeJS and NPM

    https://github.com/joyent/node/wiki/Installation

### Install imagemagick

    $ sudo apt-get install imagemagick

### Clone this repository on to hard drive

    $ git clone git@github.com:thechronicle/website.git

### Install dependencies specified in package.json

    $ cd website

    $ npm install

### Start server

    $ node server.js

server will be started on port 4000, you should be able to access the site at

    http://localhost:4000

### Set Chronicle configuration settings

Navigate to http://localhost:4000 and fill out all fields of the configuration form you are presented with. This page only shows up when your chronicle environment has no configuration settings defined. After you set your config settings, the site will work as normal. To change config settings after you have initially set them through this web page, edit the configuration json object in config.js (located in the root directory).

### S3 key and secret - config properties

All configuration properties have a default value currently except S3 Key and Secret due to their secure nature. To find the Key and Secret for your S3 environment, go to: https://aws-portal.amazon.com/gp/aws/developer/account/index.html?action=access-key

### Adding your own configuration properties

As you continue to extend the Chronicle framework, you may find that defining some configuration globals would be useful. To add a configuration parameter to appear in the initial configuration set up web page, navigate to /thechronicle_modules/config/lib/config-params.js and add your new configuration parameter (name, description, and default value [if desired]) to the configParams object. Then restart the server to and go to localhost:4000/ to define a value for your new configuration option.

### Accessing configuration properties

In the code, you can access global configuration settings by:
	var config = require('./thechronicle_modules/config');
	param_value = config.get(param_name);

### Default Admin username and password

You will need the admin username and password to change configuration settings. Currently, any username / password combination works.
