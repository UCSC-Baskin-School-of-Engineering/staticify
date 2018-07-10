const fs = require('fs');
const cheerio = require('cheerio');

/*
  Create a 404 page using index.html as template
*/

const directory = process.argv[2];

// Read file
let fileContent;
try {
  fileContent = fs.readFileSync(`${directory}/index.html`, { encoding: 'utf8' });
} catch(e) {
  console.error(`Failed to parse: ${directory}/index.html`);
  process.exit(1);
}

// jQuery for node!
const $ = cheerio.load(fileContent);


// Replace content with 404 message
$('#content').html(`
<h1>404</h1>
<p>Sorry, the file you requested cannot be found.</p>
`);


// Re-write file
fs.writeFileSync(`${directory}/404.html`, $.html(), { encoding: 'utf8' });
