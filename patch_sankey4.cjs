const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const targetNodesLinks = `const nodes = [
    { name: 'Applied' }, // Root node
    { name: 'Awaiting Response' },
    { name: 'Ghosted' },
    { name: 'Rejected' },
    { name: 'Screening' },
    { name: 'Technical' },
    { name: 'Final' },
    { name: 'Offer' },
  ];
  
  const links: any[] = [];
  
  const reachedScreening = counts['Screening'] + counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedTechnical = counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedFinal = counts['Final'] + counts['Offer'];
  const reachedOffer = counts['Offer'];

  if (counts['Applied'] > 0) links.push({ source: 'Applied', target: 'Awaiting Response', value: counts['Applied'] });
  if (counts['Ghosted'] > 0) links.push({ source: 'Applied', target: 'Ghosted', value: counts['Ghosted'] });
  if (counts['Rejected'] > 0) links.push({ source: 'Applied', target: 'Rejected', value: counts['Rejected'] });
  if (reachedScreening > 0) links.push({ source: 'Applied', target: 'Screening', value: reachedScreening });
  
  if (reachedTechnical > 0) links.push({ source: 'Screening', target: 'Technical', value: reachedTechnical });
  if (reachedFinal > 0) links.push({ source: 'Technical', target: 'Final', value: reachedFinal });
  if (reachedOffer > 0) links.push({ source: 'Final', target: 'Offer', value: reachedOffer });`;

const newNodesLinks = `  const reachedScreening = counts['Screening'] + counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedTechnical = counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedFinal = counts['Final'] + counts['Offer'];
  const reachedOffer = counts['Offer'];

  const nodes = [
    { name: 'Applied', value: total },
    { name: 'Ghosted', value: counts['Ghosted'] },
    { name: 'Rejected', value: counts['Rejected'] },
    { name: 'Screening', value: reachedScreening },
    { name: 'Technical', value: reachedTechnical },
    { name: 'Final', value: reachedFinal },
    { name: 'Offer', value: reachedOffer },
  ].filter(n => n.value > 0);

  const links: any[] = [];

  if (counts['Ghosted'] > 0) links.push({ source: 'Applied', target: 'Ghosted', value: counts['Ghosted'] });
  if (counts['Rejected'] > 0) links.push({ source: 'Applied', target: 'Rejected', value: counts['Rejected'] });
  if (reachedScreening > 0) links.push({ source: 'Applied', target: 'Screening', value: reachedScreening });
  
  if (reachedTechnical > 0) links.push({ source: 'Screening', target: 'Technical', value: reachedTechnical });
  if (reachedFinal > 0) links.push({ source: 'Technical', target: 'Final', value: reachedFinal });
  if (reachedOffer > 0) links.push({ source: 'Final', target: 'Offer', value: reachedOffer });`;

code = code.replace(targetNodesLinks, newNodesLinks);
fs.writeFileSync('src/components/SankeyChart.tsx', code);
console.log("Patched SankeyChart 4");
