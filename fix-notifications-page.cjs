const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsPage.tsx', 'utf8');

code = code.replace('<div className="min-h-screen bg-[#faf9f7] font-sans text-[#121722] pb-12">', '<div className="h-full bg-transparent font-sans text-[#121722] pb-12">');

fs.writeFileSync('src/components/NotificationsPage.tsx', code);
