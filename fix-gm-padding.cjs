const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

// Replace the outer container to match standard
code = code.replace(
  '<div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-[#efefef] shadow-2xs overflow-hidden w-full flex-1 min-h-[500px] relative">',
  '<div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative">'
);

// Since we now have p-4 sm:p-6 on the container, the header doesn't need it.
code = code.replace(
  '<div className="p-4 sm:p-6 border-b border-[#efefef] shrink-0">',
  '<div className="pb-4 sm:pb-6 border-b border-[#efefef] shrink-0">'
);

// And the list below it also doesn't need its own outer padding, but let's check its wrapper
code = code.replace(
  '<div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#faf9f7]/30">',
  '<div className="flex-1 overflow-y-auto custom-scrollbar pt-6 bg-transparent">'
);

fs.writeFileSync('src/components/GlobalMarket.tsx', code);
