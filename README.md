### Install NodeJS and NPM

    https://github.com/joyent/node/wiki/Installation

### Clone this repository on to hard drive

    $ git clone git@github.com:thechronicle/website.git

### Install dependencies specified in package.json

    $ cd website

    $ npm install

### Set database url and name using env variables

replace YOUR_DATABASE_NAME with desired database name(its a good idea to put your name in there so your name doesn't collide with someone else's)

    $ export COUCHDB_URL=http://chrondev:pikachu@chrondev.iriscouch.com
    $ export COUCHDB_DATABASE=YOUR_DATABASE_NAME

### Initialize database

    $ node ./thechronicle_modules/db-abstract/db_design.js 

go to url below to check that your database has been created

    http://chrondev:pikachu@chrondev.iriscouch.com/_utils 

### Start server

    $ node server.js

server will be started on port 4000, you should be able to access the site at

    http://localhost:4000