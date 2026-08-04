const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

code = code.replace(/  const nodes = \[\n    \{ name: 'Total Applications' \},\n    \.\.\.firstLevelTargets,\n    \{ name: 'Technical', value: reachedTechnical \},\n    \{ name: 'Final', value: reachedFinal \},\n    \{ name: 'Offer', value: reachedOffer \},\n  \]\.filter\(n => n\.name === 'Total Applications' \|\| n\.value > 0\);/g, `  const nodes: {name: string, value?: number}[] = [
    { name: 'Total Applications' },
    ...firstLevelTargets,
    { name: 'Technical', value: reachedTechnical },
    { name: 'Final', value: reachedFinal },
    { name: 'Offer', value: reachedOffer },
  ].filter(n => n.name === 'Total Applications' || (n.value && n.value > 0));`);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
