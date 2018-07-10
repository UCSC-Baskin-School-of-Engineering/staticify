# Staticify
Create a static mirror of a Drupal 7 website. 

## Setup
1. Install node.js ^8.0.0 (I prefer to install it with [nvm](https://github.com/creationix/nvm#installation))
2. Run `npm install`

## Directions
Run `bash staticify.sh <domain_name>` to generate a static site. A folder with the same name as the website will be generated containing the static content.

Example: `bash staticify.sh www.example.com`

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
