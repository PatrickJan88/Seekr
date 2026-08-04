const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const nodesReplacement = `
  const nodes = [
    { name: 'Total Applications', value: 1 }, // temporary value just for filter
    ...firstLevelTargets,
    { name: 'Technical', value: reachedTechnical },
    { name: 'Final', value: reachedFinal },
    { name: 'Offer', value: reachedOffer },
  ].filter(n => n.name === 'Total Applications' || (n.value && n.value > 0))
   .map(n => ({ name: n.name }));
`;

code = code.replace(/  const nodes = \[\s*\{ name: 'Total Applications' \},\s*\.\.\.firstLevelTargets,\s*\{ name: 'Technical' \},\s*\{ name: 'Final' \},\s*\{ name: 'Offer' \},\s*\]\.map\(n => \(\{ name: n\.name \}\)\);/, nodesReplacement);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
