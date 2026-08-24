const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  /\{view === 'sankey' && <SankeyChart applications=\{filteredApplications\} \/>\}/g,
  `{view === 'sankey' && <SankeyChart applications={filteredApplications} onAdd={() => { setEditingApp(null); setIsFormOpen(true); }} />}`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
