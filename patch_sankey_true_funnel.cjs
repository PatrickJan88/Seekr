const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const regex = /const firstLevelTargets =[\s\S]*?firstLevelTargets\.forEach\(target => \{\n    if \(target\.value > 0\) \{\n      links\.push\(\{ source: 'Total Applications', target: target\.name, value: target\.value \}\);\n    \}\n  \}\);/m;

const replacement = `const reachedScreening = counts['Screening'] + counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedTechnical = counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedFinal = counts['Final'] + counts['Offer'];
  const reachedOffer = counts['Offer'];

  const nodes = [
    { name: 'Total Applications', itemStyle: { color: '#162456' } },
    { name: 'In Review / Pending', itemStyle: { color: '#b9f8cf' } },
    { name: 'Ghosted', itemStyle: { color: '#e2e8f0' } },
    { name: 'Rejected', itemStyle: { color: '#ffe2e2' } },
    { name: 'Screening', itemStyle: { color: '#8ec5ff' } },
    { name: 'Technical', itemStyle: { color: '#8ec5ff' } },
    { name: 'Final', itemStyle: { color: '#8ec5ff' } },
    { name: 'Offer', itemStyle: { color: '#8ec5ff' } },
  ];

  const links: any[] = [];
  
  if (counts['Applied'] > 0) links.push({ source: 'Total Applications', target: 'In Review / Pending', value: counts['Applied'] });
  if (counts['Ghosted'] > 0) links.push({ source: 'Total Applications', target: 'Ghosted', value: counts['Ghosted'] });
  if (counts['Rejected'] > 0) links.push({ source: 'Total Applications', target: 'Rejected', value: counts['Rejected'] });
  
  if (reachedScreening > 0) links.push({ source: 'Total Applications', target: 'Screening', value: reachedScreening });
  if (reachedTechnical > 0) links.push({ source: 'Screening', target: 'Technical', value: reachedTechnical });
  if (reachedFinal > 0) links.push({ source: 'Technical', target: 'Final', value: reachedFinal });
  if (reachedOffer > 0) links.push({ source: 'Final', target: 'Offer', value: reachedOffer });`;

code = code.replace(regex, replacement);

// Wait, the formatting in tooltip and label might show the funnel values (e.g. Screening = 4).
// Let's add a custom tooltip and label formatter to show the active counts!
code = code.replace(/formatter: '\{b\} \(\{c\}\)'/, `formatter: (params: any) => {
            if (params.dataType === 'node') {
              const category = params.name === 'In Review / Pending' ? 'Applied' : params.name;
              const count = category === 'Total Applications' ? applications.length : (counts[category as keyof typeof counts] || 0);
              return \`\${params.name} (\${count})\`;
            }
            return \`\${params.name}: \${params.value}\`;
          }`);
          
code = code.replace(/tooltip: \{\n      trigger: 'item',\n      triggerOn: 'mousemove'\n    \},/, `tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const category = params.name === 'In Review / Pending' ? 'Applied' : params.name;
          const count = category === 'Total Applications' ? applications.length : (counts[category as keyof typeof counts] || 0);
          return \`\${params.name}<br/>Active in stage: \${count}<br/>Total reached stage: \${params.value}\`;
        }
        return \`\${params.data.source} → \${params.data.target}<br/>Count: \${params.value}\`;
      }
    },`);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
