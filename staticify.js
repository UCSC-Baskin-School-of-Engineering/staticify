const { exec, spawn } = require('child_process');
const { join } = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');


const spawnAsync = (cmd_string, opts) => new Promise((resolve, reject) => {
  const args = cmd_string.split(/\s+/);
  const cmd = args.shift();

  spawn(cmd, args, opts)
  .once('close', (code) => code === 0 ? resolve(code) : reject(code));
});

const rreaddirSync = (path) => {
  const files = [];
  let size = 0;

  process.chdir(path);

  const rreaddir = (dir) => {
    for (const _file of fs.readdirSync(dir)) {
      const file = join(dir, _file);
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

  // Remove biblio link
  // $('#block-system-main-menu ul li > a[href*="biblio.html"]').parent().remove();

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

  try {
    await spawnAsync(`wget -o ../.download.log -e robots=off -x -r -p --restrict-file-names=unix \
-l inf -E --convert-links -X /search,/user,/system/files/secure*,/biblio \
-D ${domain} ${domain}`, { cwd: './static_websites' });
  } catch(code) {
    if (code !== 8) throw `wget error code: ${code}. See file: ./.download.log`;
  }

  await fs.remove(`./.download.log`);

  await fs.remove(`${path}/search.html`);

  const { files, size } = rreaddirSync(path);

  if (!files.length) throw 'Failed to fetch website';

  const resultInfo = {
    size_kb: Math.round(size / 1024),
    domain,
    html_files: files.filter((file) => file.endsWith('.html')),
  };
  
  await Promise.all(resultInfo.html_files.map(async (file) => {
    const fileContents = (await fs.readFile(`${path}/${file}`, 'utf8')).toString();

    const $ = cheerio.load(fileContents);

    cleanHtml($);

    await fs.outputFile(`${path}/${file}`, $.html());

    if (file === 'index.html') {
      resultInfo.owner = getOwner($);
      await create404($, path);
    }
  }));

  await fs.writeJson(`${path}/.staticify.json`, resultInfo, { spaces: 2 });
};


if (require.main === module) {
  
  const domain = process.argv[2];
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
