const fs = require('fs');
let code = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');

code = code.replace(
  '<div className="w-full flex-1 flex flex-col space-y-6 min-h-0">',
  `<div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative overflow-y-auto custom-scrollbar space-y-6">`
);

// Close the new wrapper div at the end
code = code.replace(
  /    <\/div>\n  \);\n}/,
  `      </div>\n    </div>\n  );\n}`
);

// For the workflow step card, remove its border/shadow/bg if it's already inside a big white container, 
// or just make it fill the container cleanly.
code = code.replace(
  '<div className="w-full max-w-xl bg-white border border-[#efefef] rounded-2xl p-8 shadow-2xs text-center relative overflow-hidden">',
  '<div className="w-full max-w-xl bg-transparent p-8 text-center relative overflow-hidden">'
);

// For the results bento cards, change them to bg-[#faf9f7] and remove shadow, keep a light border.
code = code.replaceAll(
  'bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs',
  'bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 shadow-none'
);
// Also top bar navigation in results
code = code.replace(
  '<div className="bg-white border border-[#efefef] rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">',
  '<div className="bg-[#faf9f7] border border-[#efefef] rounded-2xl p-4 shadow-none flex flex-wrap items-center justify-between gap-4">'
);

fs.writeFileSync('src/components/CVMatchAssessment.tsx', code);
