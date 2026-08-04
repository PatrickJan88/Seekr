const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

// Replace the nodes mapping to remove 'value'
const nodesReplacement = `
  const nodes = [
    { name: 'Total Applications' },
    ...firstLevelTargets,
    { name: 'Technical' },
    { name: 'Final' },
    { name: 'Offer' },
  ].map(n => ({ name: n.name }));
`;

// Also we need to change colors to amber: oklch(76.9% 0.188 70.08) which is roughly Tailwind amber-500 (#f59e0b)
// We will set the color palette for the series
const colorReplacement = `
    color: ['#f59e0b', '#fbbf24', '#d97706', '#b45309', '#fcd34d', '#78350f', '#92400e'],
    series: {
`;

code = code.replace(/  const nodes: \{name: string, value\?: number\}\[\] = \[\s*\{ name: 'Total Applications' \},\s*\.\.\.firstLevelTargets,\s*\{ name: 'Technical', value: reachedTechnical \},\s*\{ name: 'Final', value: reachedFinal \},\s*\{ name: 'Offer', value: reachedOffer \},\s*\]\.filter\(\(n: any\) => n\.name === 'Total Applications' \|\| \(n\.value && n\.value > 0\)\);/, nodesReplacement);

code = code.replace(/series: \{/, colorReplacement);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
