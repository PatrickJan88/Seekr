const grid1 = [
  ["Company", "Position", "Status"],
  ["Test 12", "SWE", "Applied"],
  [" ", "", undefined],
  [null, null, null],
  ["Unknown", "Unknown", ""]
];

let grid = grid1;
grid = grid.filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));

const isHeader = (str) => {
  const s = String(str || '').toLowerCase().trim();
  return ['company', 'employer', 'organization', 'position', 'title', 'role', 'job title', 'status', 'stage', 'state', 'applied date', 'date', 'contact', 'notes'].some(h => s.includes(h));
};

let headerRowIndex = 0;
let maxHeaders = 0;

for (let i = 0; i < Math.min(10, grid.length); i++) {
  const count = grid[i].filter(isHeader).length;
  if (count > maxHeaders) {
    maxHeaders = count;
    headerRowIndex = i;
  }
}

let headers = (grid[headerRowIndex] || []).map(h => String(h || '').trim().toLowerCase());
let dataRows = grid.slice(headerRowIndex + 1);

const imports = dataRows.map(row => {
  const normalized = {};
  headers.forEach((h, i) => {
    if (h) normalized[h] = row[i];
  });
  
  const company = normalized['company'] || row[0] || 'Unknown';
  const position = normalized['position'] || row[1] || 'Unknown';
  
  return { company, position };
}).filter(item => item.company !== 'Unknown' || item.position !== 'Unknown');

console.log("Imports:", imports);
