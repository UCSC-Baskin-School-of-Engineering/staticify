const fs = require('fs-extra');
const readline = require('readline');
const { spawn } = require('child_process');
const { promisify } = require('util');
const GoogleSpreadsheet = require('google-spreadsheet');


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


const creds = require('./creds.json');
const SPREADSHEET_ID = '10lpTpdJPxL-neGM6MbN43vlvWZw32N4xToPwhoxRNx4';
const USER = 'Wyatt';
const WWW_PATH = '/home/wyatt/Documents/Work/soe_migrate/public_html';
const SITE_PATH = '/home/wyatt/Documents/Work/staticify/static_websites';


const init = async () => {

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

  await pr(doc.useServiceAccountAuth, creds);

  const info = await pr(doc.getInfo);

  const sheet = info.worksheets[0];

  return sheet;
};

const getNextDomain = async (sheet) => {

  await fs.ensureDir(WWW_PATH);

  if ((await fs.readdir(WWW_PATH)).length > 0) {
    console.log('www directory is not empty, attempting removal...');

    const info = await fs.readJson(`${WWW_PATH}/.staticify.json`);

    await fs.move(WWW_PATH, `${SITE_PATH}/${info.domain}`);
    console.log('Moved to domain:', domain);

    await fs.mkdir(WWW_PATH);
  }

  const rows = await pr(sheet.getRows, { query: `auditor == "${USER}" and status == "In Progress"`, limit: 1 });

  if (rows.length === 0) throw 'No more rows!';

  const row = rows[0];

  const domain = row.domains;
  console.log('Loading domain:', domain);

  if (!(await fs.exists(`${SITE_PATH}/${domain}`)))
    throw `Domain '${domain}' is not downloaded!`;

  await fs.move(`${SITE_PATH}/${domain}`, WWW_PATH, { overwrite: true });

  const browser = spawn('google-chrome', ['--incognito', '--no-cache', '--new-window', 'localhost', `https://${domain}`]);

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

  while (true) {
    const { row, browser } = await getNextDomain(sheet);

    const cmd = await prompt('Good (<ENTER>), Exit (e), Not Drupal (n), or Note (<note>)?');

    browser.kill();

    await fs.move(WWW_PATH, `${SITE_PATH}/${row.domains}`);

    if (cmd === 'e') break;

    await saveDomain(row, cmd);
  }

  rl.close();
})
.catch((err) => {
  rl.close();
  console.error(err);
});
