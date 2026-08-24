const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsPage.tsx', 'utf8');

code = code.replace(
  '<div className="h-full bg-transparent font-sans text-[#121722] pb-12">',
  '<div className="flex-1 flex flex-col font-sans text-[#121722] w-full min-h-0">'
);
code = code.replace(
  '<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">',
  '<div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">'
);
fs.writeFileSync('src/components/NotificationsPage.tsx', code);
