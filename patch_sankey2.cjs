const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');
code = code.replace(`'Saved': 0,\n    `, '');
fs.writeFileSync('src/components/SankeyChart.tsx', code);
console.log("Patched SankeyChart again");
