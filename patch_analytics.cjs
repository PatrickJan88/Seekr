const fs = require('fs');
let content = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

content = content.replace(/border-2/g, 'border');
content = content.replace(/rounded-2xl/g, 'rounded-xl');

// The dark blue block might also have border-[#314158], which is fine to change from border-2 to border
fs.writeFileSync('src/components/Analytics.tsx', content);
