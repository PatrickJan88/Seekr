const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

code = code.replace(
  '<div className="flex-1 flex flex-col gap-4 min-h-0">',
  `<div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative overflow-hidden gap-4">`
);

code = code.replace(
  /    <\/div>\n  \);\n}/,
  `      </div>\n    </div>\n  );\n}`
);

// We should also adjust Kanban columns background?
// Currently Kanban columns might be bg-white or bg-[#faf9f7] 
// Let's check them if we need, but standard Kanban layout can live inside the white box.

fs.writeFileSync('src/components/Kanban.tsx', code);
