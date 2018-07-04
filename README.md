# Staticify
Create a static mirror of any website. 

## Setup
1. Install node.js ^8.0.0 (I like to install it with [nvm](https://github.com/creationix/nvm#installation))
2. Run `npm install`

## Directions
Run `bash getsite.sh <domain_name> [--hide-html]` to generate a static site. A folder with the same name as the website will be generated containing the static content.

The `--hide-html` option will remove the html extension from all href links in the static html files.

Example: `bash getsite.sh www.example.com`

## Extra
If you plan on using Apache to host the static site, include the following configurations to ignore `html` file extensions:
```Apache
RewriteEngine on
RewriteCond %{REQUEST_FILENAME} !-d          # is not directory
RewriteCond %{REQUEST_FILENAME}\.html -f     # is an existing html file
RewriteRule ^(.*)$ $1.html                   # rewrite index to index.html
```
