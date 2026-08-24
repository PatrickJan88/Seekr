const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  `<div className="flex items-center gap-2 text-sm text-[#777c86] ml-2 border-l border-[#efefef] pl-4">
               <span className="font-medium text-[#121722] truncate capitalize">{displayTitle}</span>
             </div>`,
  `<div className="flex items-center gap-2 text-[13px] text-[#777c86] ml-2 border-l border-transparent pl-2">
               <span className="hidden sm:inline-block">Seekr App</span>
               <span className="hidden sm:inline-block text-[#d1d5db]">/</span>
               <span className="font-semibold text-[#121722] truncate capitalize">{displayTitle}</span>
             </div>`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
