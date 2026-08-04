const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

code = code.replace(/      layout: 'none',\n/, '');
code = code.replace(/      layoutIterations: 0,\n/, '');

fs.writeFileSync('src/components/SankeyChart.tsx', code);
