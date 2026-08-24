const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const titleMap = `const viewTitles: Record<string, string> = {
    'sankey': 'Overview',
    'global-market': 'Job Market',
    'kanban': 'My Applications',
    'analytics': 'Analytics',
    'cv-match': 'AI Evaluator',
    'settings': 'Settings',
    'notifications': 'Notifications',
    'eval-history': 'Evaluation History'
  };`;

// Add the map inside the component or just before it. Let's put it right before the return statement of Dashboard.
const returnIdx = code.lastIndexOf('  return (');

const insertion = `  ${titleMap}
  const displayTitle = viewTitles[view] || view.replace('-', ' ');
`;

code = code.substring(0, returnIdx) + insertion + code.substring(returnIdx);

code = code.replace(
  '<span className="font-medium text-[#121722] truncate capitalize">{view.replace(\'-\', \' \')}</span>',
  '<span className="font-medium text-[#121722] truncate capitalize">{displayTitle}</span>'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
