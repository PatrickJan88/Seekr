const grid = [
  ["Company"],
  ["Google"],
  ["Position"],
  ["SWE"],
  ["Status"],
  ["Applied"]
];

const isHeader = (str) => {
  const s = String(str || '').toLowerCase().trim();
  return ['company', 'employer', 'organization', 'position', 'title', 'role', 'job title', 'status', 'stage', 'state', 'applied date', 'date', 'contact', 'notes'].some(h => s.includes(h));
};

const row1 = grid[0] || [];
let row1HeaderCount = row1.filter(isHeader).length;

const col1 = grid.map(row => row[0]);
let col1HeaderCount = col1.filter(isHeader).length;

console.log("row1 headers:", row1HeaderCount);
console.log("col1 headers:", col1HeaderCount);
if (col1HeaderCount > row1HeaderCount && col1HeaderCount >= 2) {
  console.log("Transposed!");
} else {
  console.log("Not transposed");
}
