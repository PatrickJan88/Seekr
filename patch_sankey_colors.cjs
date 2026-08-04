const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const majorColor = 'oklch(95.1% 0.026 236.824)';
const redColor = 'oklch(93.6% 0.032 17.717)';
const slateColor = 'oklch(92.9% 0.013 255.508)';

code = code.replace(
  /const firstLevelTargets = \[\s*\{ name: 'In Review \/ Pending', value: counts\['Applied'\] \},\s*\{ name: 'Ghosted', value: counts\['Ghosted'\] \},\s*\{ name: 'Rejected', value: counts\['Rejected'\] \},\s*\{ name: 'Screening', value: reachedScreening \},\s*\]\.sort\(\(a, b\) => b\.value - a\.value\);/,
  `const firstLevelTargets = [
    { name: 'In Review / Pending', value: counts['Applied'], itemStyle: { color: '${majorColor}' } },
    { name: 'Ghosted', value: counts['Ghosted'], itemStyle: { color: '${slateColor}' } },
    { name: 'Rejected', value: counts['Rejected'], itemStyle: { color: '${redColor}' } },
    { name: 'Screening', value: reachedScreening, itemStyle: { color: '${majorColor}' } },
  ].sort((a, b) => b.value - a.value);`
);

code = code.replace(
  /const nodes = \[\s*\{ name: 'Total Applications', value: totalValue \},\s*\.\.\.firstLevelTargets,\s*\{ name: 'Technical', value: reachedTechnical \},\s*\{ name: 'Final', value: reachedFinal \},\s*\{ name: 'Offer', value: reachedOffer \},\s*\]\.filter\(n => n\.value > 0\);/,
  `const nodes = [
    { name: 'Total Applications', value: totalValue, itemStyle: { color: '${majorColor}' } },
    ...firstLevelTargets,
    { name: 'Technical', value: reachedTechnical, itemStyle: { color: '${majorColor}' } },
    { name: 'Final', value: reachedFinal, itemStyle: { color: '${majorColor}' } },
    { name: 'Offer', value: reachedOffer, itemStyle: { color: '${majorColor}' } },
  ].filter(n => n.value > 0);`
);

// We should also change the global lineStyle color to 'target' so that lines going into rejected/ghosted are colored appropriately.
code = code.replace(/levels: \[\s*\{\s*depth: 0,[\s\S]*?\}\s*\]/, `levels: [
          {
            depth: 0,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          },
          {
            depth: 1,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          },
          {
            depth: 2,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          },
          {
            depth: 3,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          },
          {
            depth: 4,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          }
        ]`);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
