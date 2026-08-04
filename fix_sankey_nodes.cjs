const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const nodesBlock = `  const totalValue = firstLevelTargets.reduce((sum, t) => sum + t.value, 0);

  const nodes = [
    { name: 'Total Applications', value: totalValue },
    ...firstLevelTargets,
    { name: 'Technical', value: reachedTechnical },
    { name: 'Final', value: reachedFinal },
    { name: 'Offer', value: reachedOffer },
  ].filter(n => n.value > 0);`;

code = code.replace(/  const nodes = \[\s*\{ name: 'Total Applications'[\s\S]*?\.map\(n => \(\{ name: n\.name \}\)\);/, nodesBlock);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
