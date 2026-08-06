const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

content = content.replace(/select-none focus:outline-none/g, 'select-none outline-none focus:outline-none ring-0 focus:ring-0');

fs.writeFileSync('src/components/ListView.tsx', content);
