const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

code = code.replace(
  '<div className="flex-grow flex flex-col h-full bg-white rounded-2xl border border-[#efefef] shadow-2xs overflow-hidden">',
  '<div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-[#efefef] shadow-2xs overflow-hidden">'
);
fs.writeFileSync('src/components/GlobalMarket.tsx', code);
