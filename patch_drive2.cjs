const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const startIdx = code.indexOf('<button\\n                onClick={async () => {\\n                  const link = window.prompt("Paste your Google Drive document link:");');
const searchStr = '<button\\n                onClick={async () => {';
// wait, the exact string is in Dashboard.tsx, let's find it.
