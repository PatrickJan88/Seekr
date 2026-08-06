const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

content = content.replace(/onClick=\{\(\) => requestSort\('position'\)\}/g, "onClick={() => requestSort('position')} onMouseDown={(e) => e.preventDefault()}");
content = content.replace(/onClick=\{\(\) => requestSort\('company'\)\}/g, "onClick={() => requestSort('company')} onMouseDown={(e) => e.preventDefault()}");
content = content.replace(/onClick=\{\(\) => requestSort\('appliedDate'\)\}/g, "onClick={() => requestSort('appliedDate')} onMouseDown={(e) => e.preventDefault()}");
content = content.replace(/onClick=\{\(\) => requestSort\('status'\)\}/g, "onClick={() => requestSort('status')} onMouseDown={(e) => e.preventDefault()}");

fs.writeFileSync('src/components/ListView.tsx', content);
