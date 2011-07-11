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

### Set S3 bucket name, key, and secret using env variables

Keys and secret can be found at: https://aws-portal.amazon.com/gp/aws/developer/account/index.html?action=access-key
Bucket name can be found at: https://console.aws.amazon.com/s3/home

    $ export S3_BUCKET=YOUR_BUCKET_NAME
    $ export S3_KEY=YOUR_KEY 
    $ export S3_SECRET=YOUR_SECRET

### Start server

    $ node server.js

server will be started on port 4000, you should be able to access the site at

    http://localhost:4000
