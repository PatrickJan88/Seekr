const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const regex = /const reachedScreening =[\s\S]*?const links: any\[\] = \[\];[\s\S]*?if \(reachedOffer > 0\) links\.push\(\{ source: 'Final', target: 'Offer', value: reachedOffer \}\);/m;

const replacement = `const reachedScreening = counts['Screening'] + counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedTechnical = counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedFinal = counts['Final'] + counts['Offer'];
  const reachedOffer = counts['Offer'];

  // Sort first level targets
  const firstLevelTargets = [
    { name: 'In Review / Pending', value: counts['Applied'], itemStyle: { color: '#b9f8cf' } },
    { name: 'Ghosted', value: counts['Ghosted'], itemStyle: { color: '#e2e8f0' } },
    { name: 'Rejected', value: counts['Rejected'], itemStyle: { color: '#ffe2e2' } },
    { name: 'Screening Pipeline', value: reachedScreening, itemStyle: { color: '#8ec5ff' } },
  ].sort((a, b) => b.value - a.value);

  const totalValue = firstLevelTargets.reduce((sum, t) => sum + t.value, 0);

  const nodes = [
    { name: 'Total Applications', value: totalValue, itemStyle: { color: '#162456' } },
    ...firstLevelTargets,
    { name: 'Technical Pipeline', value: reachedTechnical, itemStyle: { color: '#8ec5ff' } },
    { name: 'Final Pipeline', value: reachedFinal, itemStyle: { color: '#8ec5ff' } },
    { name: 'Offer', value: counts['Offer'], itemStyle: { color: '#8ec5ff' } },
    { name: 'Active in Screening', value: counts['Screening'], itemStyle: { color: '#8ec5ff' } },
    { name: 'Active in Technical', value: counts['Technical'], itemStyle: { color: '#8ec5ff' } },
    { name: 'Active in Final', value: counts['Final'], itemStyle: { color: '#8ec5ff' } },
  ].filter(n => n.value > 0);

  const links: any[] = [];
  
  // Add first level links in the sorted order
  firstLevelTargets.forEach(target => {
    if (target.value > 0) {
      links.push({ source: 'Total Applications', target: target.name, value: target.value });
    }
  });

  if (reachedTechnical > 0) links.push({ source: 'Screening Pipeline', target: 'Technical Pipeline', value: reachedTechnical });
  if (counts['Screening'] > 0) links.push({ source: 'Screening Pipeline', target: 'Active in Screening', value: counts['Screening'] });

  if (reachedFinal > 0) links.push({ source: 'Technical Pipeline', target: 'Final Pipeline', value: reachedFinal });
  if (counts['Technical'] > 0) links.push({ source: 'Technical Pipeline', target: 'Active in Technical', value: counts['Technical'] });

  if (counts['Offer'] > 0) links.push({ source: 'Final Pipeline', target: 'Offer', value: counts['Offer'] });
  if (counts['Final'] > 0) links.push({ source: 'Final Pipeline', target: 'Active in Final', value: counts['Final'] });`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
