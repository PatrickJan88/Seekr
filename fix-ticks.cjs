const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

code = code.replace("paddingLeft: \\`\\${level * 12 + 10}px\\`", "paddingLeft: `${level * 12 + 10}px`");
code = code.replace("left: \\`\\${level * 12 + 17.5}px\\`", "left: `${level * 12 + 17.5}px`");

fs.writeFileSync('src/components/SidebarNav.tsx', code);
