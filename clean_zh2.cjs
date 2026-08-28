const fs = require('fs');

function replaceAll(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

// 1. HeadcountTrendChart.tsx
let hcChart = fs.readFileSync('src/components/HeadcountTrendChart.tsx', 'utf8');
hcChart = hcChart.replace(/isZh\?: boolean;/g, '');
hcChart = hcChart.replace(/isZh = false/g, '');
hcChart = hcChart.replace(/isZh \? '.*?' : ('.*?')/g, '$1');
hcChart = hcChart.replace(/isZh \? `.*?` : (`.*?`)/g, '$1');
hcChart = hcChart.replace(/isZh \? .*? : (.*?)(?=\s)/g, '$1');
// specific to HC chart
hcChart = hcChart.replace(/\{isZh \? `员工总数 · \$\{activePoint\.headcount\} 人` : (`Employee headcount · \$\{activePoint\.headcount\}`)\}/g, '{$1}');
hcChart = hcChart.replace(/\{isZh \? '上月增长' : 'last month'\}/g, "{'last month'}");
fs.writeFileSync('src/components/HeadcountTrendChart.tsx', hcChart);

// 2. CompanyIntelligenceStudio.tsx
let cis = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf8');
cis = cis.replace(/const \[isZh, setIsZh\] = useState\(false\);/g, '');
cis = cis.replace(/\{isZh\s*\? '.*? \? '.*?' : ('.*?')/g, '$1');
// wait, line 674: `{isZh `
cis = cis.replace(/\{isZh \? '.*?' : 'Reverse-Engineering.*?'\}/g, "{'Fetching...'}");
cis = cis.replace(/isZh=\{isZh\}/g, '');
fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', cis);

// 3. CVMatchAssessment.tsx
let cvm = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');
cvm = cvm.replace(/\s+nameZh: '.*?',/g, '');
fs.writeFileSync('src/components/CVMatchAssessment.tsx', cvm);

// 4. src/data/evaluatorNorms.ts
let evn = fs.readFileSync('src/data/evaluatorNorms.ts', 'utf8');
evn = evn.replace(/\s+nameZh: string;/g, '');
evn = evn.replace(/\s+metricTypeZh: string;/g, '');
evn = evn.replace(/\s+descriptionZh: string;/g, '');
evn = evn.replace(/\s+whatToExtractZh: string;/g, '');
evn = evn.replace(/\s+meaningZh: string;/g, '');
evn = evn.replace(/\s+recommendedActionZh: string;/g, '');

evn = evn.replace(/\s+nameZh: '.*?',/g, '');
evn = evn.replace(/\s+metricTypeZh: '.*?',/g, '');
evn = evn.replace(/\s+descriptionZh: '.*?',/g, '');
evn = evn.replace(/\s+whatToExtractZh: '.*?'/g, '');

evn = evn.replace(/\s+meaningZh: '.*?',/g, '');
evn = evn.replace(/\s+recommendedActionZh: '.*?',/g, '');
fs.writeFileSync('src/data/evaluatorNorms.ts', evn);

console.log("Cleanup 2 done.");
