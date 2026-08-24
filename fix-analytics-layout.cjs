const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

code = code.replace(
  '<div className="grid grid-cols-12 gap-6 flex-1 min-h-0">',
  `<div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-12 gap-6 w-full">`
);

code = code.replace(
  /    <\/div>\n  \);\n}/,
  `        </div>\n      </div>\n    </div>\n  );\n}`
);

code = code.replaceAll(
  'bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs',
  'bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 shadow-none'
);

fs.writeFileSync('src/components/Analytics.tsx', code);
