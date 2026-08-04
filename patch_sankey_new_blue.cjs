const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

code = code.replace(/#dff2fe/g, '#8ec5ff');

fs.writeFileSync('src/components/SankeyChart.tsx', code);
