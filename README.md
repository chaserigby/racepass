## Setting up a local development environment
1. clone the repository
2. npm install
3. node --use-strict app.js
4. Install postgres
5. Create database racepass (use the same password as production or step 6)
6. change postgresql_uri in data/settings/production.json to match password chosen in step 5 if different.

## Setting up web server
1. clone racepass-html
2. Install nginx
3. Use something like tho following config except change the root to match where you cloned the html repo.
4. Edit the last 2 lines in js/base.js so that apiurl is set to the server you want it to use.

```
server {
        listen 0.0.0.0:80 default_server;

        rewrite ^(/includes.*)?$ $1 last;
        rewrite ^(/.*)\.html(\?.*)?$ $1$2 permanent;

        root '/mnt/c/Users/thoma/Google Drive/Projects/Racepass/html';
        index index.html;

        server_name localhost local.racepass.com;

        location / {
                ssi on;
                try_files $uri $uri.html $uri/index.html =404;
        }
}
```