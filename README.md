## Introduction
The Racepass backend is written using [expressa](https://github.com/thomas4019/expressa) which provides automatic REST endpoints based on [json schema](http://json-schema.org/) collections in data/collection, a database abstraction layer, and listeners. Most business logic is implemented in listeners in server.js.

## Setting up a local development environment
* Postgres
    1. Install postgres - [windows](https://www.postgresql.org/download/windows/)
    2. Use any username/password, create a database named "racepass".
* Setup Server
    1. git clone git@github.com:thomas4019/racepass.git
    2. cd racepass
    3. npm install
    4. Modify postgresql_uri in data/settings/development.json to match chose username/password.
        * postgres://<username>:<password>@localhost/racepass
        * Be careful to not submit this change.
* Run Server
    1. node --use-strict server.js
    2. Look for the message "Racepass server listening on port 3000!" within around 10 seconds. The server won't respond to requests until you see this. 
    3. If you see "failed to initialize race2 using postgres", then either the username/password/database info is incorrect or Postgres is not running.

## Crawlers
In the crawlers folder there are a bunch of [Scrapy](https://scrapy.org/) crawlers of varying quality.