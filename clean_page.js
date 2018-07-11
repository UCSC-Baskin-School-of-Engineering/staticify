const fs = require('fs');
const cheerio = require('cheerio');

/*
  Remove any remanence of forms from an html page
*/

const filename = process.argv[2];

// Read file
let fileContent;
try {
  fileContent = fs.readFileSync(filename, { encoding: 'utf8' });
} catch(e) {
  console.error(`Failed to parse: ${filename}`);
  process.exit(1);
}

// jQuery for node!
const $ = cheerio.load(fileContent);


// Remove search form
$('#search-block-form').remove();

// Remove search page link
$('#block-system-main-menu ul li > a[href$="/search.html"]').parent().remove();
$('#block-system-main-menu ul li > a[href="search.html"]').parent().remove();

// Remove log-in link
$('#block-soe-log-in-0').remove();


// Re-write file
fs.writeFileSync(filename, $.html(), { encoding: 'utf8' });
