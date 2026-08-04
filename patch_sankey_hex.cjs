const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

// The hex colors
const majorHex = '#dff2fe';
const redHex = '#ffe2e2';
const slateHex = '#e2e8f0';
const greenHex = '#b9f8cf';

// In Review / Pending -> greenHex
code = code.replace(
  /\{ name: 'In Review \/ Pending', value: counts\['Applied'\], itemStyle: \{ color: 'oklch\(95\.1% 0\.026 236\.824\)' \} \}/,
  `{ name: 'In Review / Pending', value: counts['Applied'], itemStyle: { color: '${greenHex}' } }`
);

// Everything else using oklch -> replace with respective Hex
code = code.replace(/oklch\(95\.1% 0\.026 236\.824\)/g, majorHex);
code = code.replace(/oklch\(93\.6% 0\.032 17\.717\)/g, redHex);
code = code.replace(/oklch\(92\.9% 0\.013 255\.508\)/g, slateHex);
code = code.replace(/oklch\(92\.5% 0\.084 155\.995\)/g, greenHex);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
