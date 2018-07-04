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
If you plan on using Apache to host the static site, I recommend atleast the following configuration, which hides `html` file extensions:
```Apache
<Directory /path/to/your/website/public_html>
	Require all granted
	DirectorySlash Off
	RewriteEngine on
	RewriteCond %{THE_REQUEST} /([^.]+)\.html [NC]
	RewriteRule ^ /%1 [NC,L,R]
	RewriteCond %{REQUEST_FILENAME}.html -f
	RewriteRule ^ %{REQUEST_URI}.html [NC,L]
</Directory>
<VirtualHost *:80>
	DocumentRoot /path/to/your/website/public_html
</VirtualHost>
```
