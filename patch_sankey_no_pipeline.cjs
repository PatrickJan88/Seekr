const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const regex = /const reachedScreening =[\s\S]*?if \(counts\['Final'\] > 0\) links\.push\(\{ source: 'Final Pipeline', target: 'Active in Final', value: counts\['Final'\] \}\);/m;

const replacement = `const firstLevelTargets = [
    { name: 'In Review / Pending', value: counts['Applied'], itemStyle: { color: '#b9f8cf' } },
    { name: 'Ghosted', value: counts['Ghosted'], itemStyle: { color: '#e2e8f0' } },
    { name: 'Rejected', value: counts['Rejected'], itemStyle: { color: '#ffe2e2' } },
    { name: 'Screening', value: counts['Screening'], itemStyle: { color: '#8ec5ff' } },
    { name: 'Technical', value: counts['Technical'], itemStyle: { color: '#8ec5ff' } },
    { name: 'Final', value: counts['Final'], itemStyle: { color: '#8ec5ff' } },
    { name: 'Offer', value: counts['Offer'], itemStyle: { color: '#8ec5ff' } },
  ].sort((a, b) => b.value - a.value);

  const totalValue = firstLevelTargets.reduce((sum, t) => sum + t.value, 0);

  const nodes = [
    { name: 'Total Applications', value: totalValue, itemStyle: { color: '#162456' } },
    ...firstLevelTargets,
  ].filter(n => n.value > 0);

  const links: any[] = [];
  
  // Add first level links in the sorted order
  firstLevelTargets.forEach(target => {
    if (target.value > 0) {
      links.push({ source: 'Total Applications', target: target.name, value: target.value });
    }
  });`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
