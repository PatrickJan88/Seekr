const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
  'className="p-6 max-w-[1400px] mx-auto w-full flex-grow flex flex-col gap-6"',
  'className="p-6 w-full flex-grow flex flex-col gap-6"'
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
