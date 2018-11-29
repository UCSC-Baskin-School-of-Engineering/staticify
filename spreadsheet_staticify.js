const { promisify } = require('util');
const GoogleSpreadsheet = require('google-spreadsheet');

const staticify = require('./staticify');


const options = require('./options.json');
const creds = require('./creds.json');
const SPREADSHEET_ID = options.spreadsheet_id;

const pr = (fn, ...args) => promisify(fn)(...args);

const getRow = async (row) => {
  console.log('Fetching:', row.domain);
  let success = true;
  
  try {
    await staticify(row.domain);

    row.status = 'In Progress';
    row.auditor = 'Wyatt';
    console.log('success');
    
  } catch(e) {
    success = false;
    console.log('Failed because:', e);

    row.status = 'Staticify Error';
  }

  await pr(row.save);

  return success;
};

module.exports = async (amount) => {

  if (amount < 1) {
    throw 'amount must be atleast 1';
  }

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

  await pr(doc.useServiceAccountAuth, creds);

  const info = await pr(doc.getInfo);
  const sheet = info.worksheets[0];

  let success = 0;
  let attempted = 0;
  for (attempted = 0; attempted < amount; attempted++) {

    // Only fetch an item at a time for syncronous sake
    const rows = await pr(sheet.getRows, {
      query: 'type == "Drupal" and status == ""',
      limit: 1,
    });
    
    const row = rows && rows.length && rows[0];
    if (!row || !row.domain) {
      console.log('Can\'t fetch any more domains!');
      break;
    }

    if (await getRow(row)) success++;
  }

  console.log(`Successfully staticified ${success} out of ${attempted} domains.`)
};

if (require.main === module) {
  Promise.resolve()
  .then(() => {
    const AMOUNT = Number.parseInt(process.argv[2]);
    if (Number.isNaN(AMOUNT)) throw 'Usage: node spreadsheet_staticify.js <amount>';
    return AMOUNT;
  })
  .then(module.exports)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
