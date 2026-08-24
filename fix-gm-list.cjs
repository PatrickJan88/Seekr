const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

code = code.replace(
  '<div className="flex-1 overflow-auto bg-[#faf9f7] relative">',
  '<div className="flex-1 overflow-auto bg-transparent relative pt-4 sm:pt-6 custom-scrollbar">'
);

fs.writeFileSync('src/components/GlobalMarket.tsx', code);
