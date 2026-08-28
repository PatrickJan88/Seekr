const fs = require('fs');

let cis = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf8');
cis = cis.replace(/\{isZh\s*\? '[^']+'\s*: ('[^']+')\}/g, "{$1}");
fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', cis);

console.log("Cleanup 3 done.");
