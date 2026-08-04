const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const targetNodesLinks = `  const nodes = [
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

const newNodesLinks = `  const nodes = [
    { name: 'Total Applications' },
    { name: 'In Review / Pending', value: counts['Applied'] },
    { name: 'Ghosted', value: counts['Ghosted'] },
    { name: 'Rejected', value: counts['Rejected'] },
    { name: 'Screening', value: reachedScreening },
    { name: 'Technical', value: reachedTechnical },
    { name: 'Final', value: reachedFinal },
    { name: 'Offer', value: reachedOffer },
  ].filter(n => n.name === 'Total Applications' || n.value > 0);

  const links: any[] = [];

  if (counts['Applied'] > 0) links.push({ source: 'Total Applications', target: 'In Review / Pending', value: counts['Applied'] });
  if (counts['Ghosted'] > 0) links.push({ source: 'Total Applications', target: 'Ghosted', value: counts['Ghosted'] });
  if (counts['Rejected'] > 0) links.push({ source: 'Total Applications', target: 'Rejected', value: counts['Rejected'] });
  if (reachedScreening > 0) links.push({ source: 'Total Applications', target: 'Screening', value: reachedScreening });
  
  if (reachedTechnical > 0) links.push({ source: 'Screening', target: 'Technical', value: reachedTechnical });
  if (reachedFinal > 0) links.push({ source: 'Technical', target: 'Final', value: reachedFinal });
  if (reachedOffer > 0) links.push({ source: 'Final', target: 'Offer', value: reachedOffer });`;

code = code.replace(targetNodesLinks, newNodesLinks);
fs.writeFileSync('src/components/SankeyChart.tsx', code);
console.log("Patched SankeyChart 5");
