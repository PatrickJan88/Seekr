const fs = require('fs');

let client = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf8');

client = client.replace(/if \(data\.meta\) \{\s*metaData = data\.meta;\s*\}/, `if (data.meta) {
                 metaData = { ...metaData, ...data.meta };
                 if (data.meta.reset) {
                    rawJsonStr = '';
                 }
              }`);

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', client);
console.log("Patched client to support reset");
