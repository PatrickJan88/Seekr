const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

content = content.replace(
  '<thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">',
  '<thead className="bg-slate-50 sticky top-0 z-10 after:content-[\'\'] after:absolute after:left-0 after:right-0 after:bottom-0 after:border-b after:border-slate-200">'
);

fs.writeFileSync('src/components/ListView.tsx', content);
