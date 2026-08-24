const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  /<JobForm\s*initialData=\{editingApp \|\| undefined\}/,
  `<JobForm\n          initialData={editingApp || undefined}\n          trackingSystem={trackingSystem}`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
