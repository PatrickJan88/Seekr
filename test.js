const fs = require('fs');
const content = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf-8');
const lines = content.split('\n');

// Find the problem around 1400-1420
for (let i = 1390; i < lines.length; i++) {
  console.log((i+1) + ": " + lines[i]);
}
