const fs = require('fs-extra');
const { exec, spawn } = require('child_process');
const cheerio = require('cheerio');
const { join } = require('path');

const execAsync = (cmd, opts) => new Promise((resolve) => exec(cmd, opts, (err) => {
  if (err) console.error('exec error:', err.code);
  resolve();
}));

const rreaddirSync = (path) => {
  const files = [];
  let size = 0;

  process.chdir(path);

  const rreaddir = (dir) => {
    const children = fs.readdirSync(dir).map(f => join(dir, f));
    for (const file of children) {
      const stat = fs.statSync(file);
      size += stat.size;
      if (stat.isDirectory()) rreaddir(file);
      else if (stat.isFile()) files.push(file);
    }
  }

  rreaddir('.');

  process.chdir('../..');

  return { files, size };
};

const create404 = async ($, dir) => {
  // Replace content with 404 message
  $('#content').html(`
  <h1>404</h1>
  <p>Sorry, the file you requested cannot be found.</p>
  `);

  // Load assets from root, not relative
  $('head').prepend('<base href="/" />');

  // Remove nav-menu active class
  $('#block-system-main-menu ul li a.active').removeClass('active');

  await fs.outputFile(`${dir}/404.html`, $.html());
};

const cleanHtml = ($) => {
  // Remove search form
  $('#search-block-form').remove();

  // Remove search page link
  $('#block-system-main-menu ul li > a[href$="/search.html"]').parent().remove();
  $('#block-system-main-menu ul li > a[href="search.html"]').parent().remove();

  // Remove log-in link
  $('#block-soe-log-in-0').remove();
};

const getOwner = ($) => {
  const href = $('#footer-contact > a[href^="mailto:"]').attr('href');
  if (href) return href.substring(7);
  return null;
};

module.exports = async (domain) => {

  const path = `./static_websites/${domain}`;

  await fs.emptyDir(path);

  await execAsync(`wget -o ${domain}/.download.log -e robots=off -N -S -x -r -p --restrict-file-names=unix \
    -l inf -E --convert-links -X /search,/user,/system/files/secure-attachments \
    -D ${domain} ${domain}`, { cwd: './static_websites' });

  await fs.remove(`${path}/search.html`);

  const { files, size } = rreaddirSync(path);

  if (!files.length) throw 'Failed to fetch website';
  
  const html_files = files.filter((file) => file.endsWith('.html'));

  let owner = null;

  await Promise.all(html_files.map(async (file) => {
    const fileContents = (await fs.readFile(`${path}/${file}`, 'utf8')).toString();

    const $ = cheerio.load(fileContents);

    cleanHtml($);

    await fs.outputFile(`${path}/${file}`, $.html());

    if (file === 'index.html') {
      owner = getOwner($);
      await create404($, path);
    }
  }));

  await fs.writeJson(`${path}/.staticify.json`, {
    size_kb: Math.round(size / 1024.),
    html_files,
    owner,
    domain,
  }, { spaces: 2 });
};


if (require.main === module) {
  
  const argv = require('minimist')(process.argv.slice(2));

  const domain = argv._[0];
  if (!domain) {
    console.error('Usage: node staticify.js <domain_name>');
    process.exit(1);
  }
  
  module.exports(domain)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

