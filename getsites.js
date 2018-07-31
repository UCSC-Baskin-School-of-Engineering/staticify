const { promisify } = require('util');
const GoogleSpreadsheet = require('google-spreadsheet');

const staticify = require('./staticify');


const creds = require('./creds.json');
const SPREADSHEET_ID = '10lpTpdJPxL-neGM6MbN43vlvWZw32N4xToPwhoxRNx4';

const pr = (fn, ...args) => promisify(fn)(...args);

const getRow = async (row) => {
  const domain = row.domains;
  console.log('Fetching:', domain);

  await staticify(domain);
  row.status = 'In Progress';
  row.auditor = 'Wyatt';
  await pr(row.save);
  console.log('success');
};

const getRows = async () => {

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

  await pr(doc.useServiceAccountAuth, creds);

  const info = await pr(doc.getInfo);
  const sheet = info.worksheets[0];

  const rows = await pr(sheet.getRows, {
    query: 'drupalwordpressother == "Drupal" and status == ""',
    limit: 50,
  });

  for (const row of rows) {
    try { getRow(row); } catch(e) { console.log('Failed'); }
  }
};

getRows()
.catch((err) => {
  console.error(err);
  process.exit(1);
});
