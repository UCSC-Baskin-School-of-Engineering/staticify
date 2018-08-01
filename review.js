const fs = require('fs-extra');
const readline = require('readline');
const { spawn } = require('child_process');
const { promisify } = require('util');
const GoogleSpreadsheet = require('google-spreadsheet');

const SITE_PATH = './static_websites';
const { www_path, username, spreadsheet_id } = require('./options.json');
const creds = require('./creds.json');

const pr = (fn, ...args) => promisify(fn)(...args);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (question) => new Promise((resolve) => {
  rl.resume();
  rl.question(question + ' ', (answer) => {
    rl.pause();
    resolve(answer.trim());
  });
});

const init = async () => {

  const doc = new GoogleSpreadsheet(spreadsheet_id);

  await pr(doc.useServiceAccountAuth, creds);

  const info = await pr(doc.getInfo);

  const sheet = info.worksheets[0];

  return sheet;
};

const getNextDomain = async (sheet) => {

  await fs.ensureDir(www_path);

  if ((await fs.readdir(www_path)).length > 0) {
    console.log('www directory is not empty, attempting removal...');

    const info = await fs.readJson(`${www_path}/.staticify.json`);
    if (!info.domain) throw 'Undefined domain name in ./.staticify.json';

    await fs.move(www_path, `${SITE_PATH}/${info.domain}`);
    console.log('Moved to domain:', info.domain);

    await fs.mkdir(www_path);
  }

  const rows = await pr(sheet.getRows, { query: `auditor == "${username}" and status == "In Progress"`, limit: 1 });

  if (rows.length === 0) throw 'No more rows!';

  const row = rows[0];

  console.log('Loading domain:', row.domain, 'into http:localhost');

  if (!(await fs.exists(`${SITE_PATH}/${row.domain}`)))
    throw `Domain '${row.domain}' is not downloaded!`;

  await fs.move(`${SITE_PATH}/${row.domain}`, www_path, { overwrite: true });

  const browser = spawn('google-chrome', ['--incognito', '--no-cache',
    '--new-window', 'localhost', `https://${row.domain}`]).on('error', () => {});

  return { row, browser };
};

const saveDomain = async (row, cmd) => {
  if (cmd === 'n') {
    row.status = '?';
    row.notes = 'Not Drupal';
  } else if (cmd) {
    row.status = 'Invalid';
    row.notes = cmd;
  } else {
    const info = await fs.readJson(`${SITE_PATH}/${row.domains}/.staticify.json`);
    row.status = 'Good';
    row.sizekb = info.size_kb;
    row.owner = info.owner;
  }

  await pr(row.save);
};

init()
.then(async (sheet) => {

  let cmd;
  do {
    const { row, browser } = await getNextDomain(sheet);

    cmd = await prompt('Good (<ENTER>), Exit (e), Not Drupal (n), or Note (<note>)?');

    browser.kill();

    await fs.move(www_path, `${SITE_PATH}/${row.domain}`);

    if (cmd !== 'e')
      await saveDomain(row, cmd);

  } while (cmd !== 'e');

  rl.close();
})
.catch((err) => {
  rl.close();
  console.error(err);
});
