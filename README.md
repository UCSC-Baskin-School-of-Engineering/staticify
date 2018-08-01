# Staticify
Create a static mirror of a Drupal 7 website.
(Specificly meant for UCSC School of Engineering sites)
- Removes login and search forms
- Creates a 404 page.

## Setup
Requires node.js 8+ (It can be installed with [Node Version Manager](https://github.com/creationix/nvm#installation))
1. `git clone https://github.com/wyattades/staticify`
2. `cd staticify`
3. `npm install`

## Directions
Run `node staticify.js <domain_name>` to generate a static site. The static content will be downloaded to the directory: `./static_websites/<domain_name>`.

Example: `node staticify.js www.example.com`

---

## Extra

### Apache
If you plan on using Apache to host the static site, I recommend atleast the following configuration, which hides `html` file extensions:
```Apache
<Directory /path/to/your/website/public_html>
	ErrorDocument 404 /404.html
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
You may need to enable the `RewriteEngine` Apache module.

### Bulk Staticify
You can bulk staticify websites with domains automatically fetched from a Google Spreadsheet by running `node bulk_staticify.js <amount>`.

### Review Static Websites
You can set the status and take notes for each staticified website specified in the Google Spreadsheet by running `node review.js`. This
will move the static site to the Apache www folder, open the browser with the static site (only tested on Linux), and prompt the user for a command status, note, or exit.

---
`bulk_staticify.js` and `review.js` BOTH REQUIRE the following files:

- `creds.json`: JSON credentials for a Google Service Account with access to your spreadsheat 
- `options.json`:
  ```json
	{
		"spreadsheet_id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
		"www_path": "/path/to/your/website/public_html",
		"username": "will show up under 'auditor' field"
	}
	```