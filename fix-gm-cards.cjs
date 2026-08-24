const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

code = code.replace(
  'className="bg-white border border-[#efefef] rounded-2xl p-5 hover:border-[#0068f9]/30 hover:shadow-md transition-all flex flex-col h-full group relative w-full"',
  'className="bg-[#faf9f7] border border-[#efefef] rounded-2xl p-5 hover:border-[#0068f9]/30 hover:shadow-md transition-all flex flex-col h-full group relative w-full"'
);

fs.writeFileSync('src/components/GlobalMarket.tsx', code);
