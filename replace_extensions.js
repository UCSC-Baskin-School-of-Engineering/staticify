const fs = require('fs');
const cheerio = require('cheerio');

const filename = process.argv[2];

const file = fs.readFileSync(filename, { encoding: 'utf8' });

const $ = cheerio.load(file);

$("[href$='html'],[src$='html']").each((_, el) => {
  el.attribs.href = el.attribs.href.substring(0, el.attribs.href.length - 5);
});

fs.writeFileSync(filename, $.html(), { encoding: 'utf8' });
