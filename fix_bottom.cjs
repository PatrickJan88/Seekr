const fs = require('fs');
let code = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf-8');

code = code.replace(/\{renderTabSwitcher\(\)\}/g, '');

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', code);
