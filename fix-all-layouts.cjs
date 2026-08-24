const fs = require('fs');

const standardOuter = '<div className="relative w-full flex-1 flex flex-col min-h-[500px]">';
const standardInner = '<div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative overflow-y-auto custom-scrollbar">';

function patchFile(filePath, innerReplaceLogic) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = innerReplaceLogic(code);
  fs.writeFileSync(filePath, code);
}

// 1. SettingsPage
patchFile('src/components/SettingsPage.tsx', (code) => {
  code = code.replace(
    /<div className="flex-1 flex flex-col font-sans text-\[#121722\] w-full min-h-full relative">\s*<div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">\s*<div className="bg-white rounded-2xl border border-\[#efefef\] overflow-hidden shadow-2xs divide-y divide-\[#efefef\]">/,
    `${standardOuter}\n      ${standardInner}`
  );
  // fix ending
  code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}/, `</div>\n    </div>\n  );\n}`);
  return code;
});

// 2. NotificationsPage
patchFile('src/components/NotificationsPage.tsx', (code) => {
  code = code.replace(
    /<div className="w-full flex-1 max-w-3xl mx-auto flex flex-col min-h-0">\s*<div className="flex items-center justify-between mb-8">[\s\S]*?<\/div>\s*<div className="bg-white rounded-2xl border border-\[#efefef\] shadow-2xs overflow-hidden flex-1 flex flex-col divide-y divide-\[#efefef\]">/,
    `${standardOuter}\n      ${standardInner}`
  );
  code = code.replace(
    /<div className="relative w-full flex-1 flex flex-col min-h-\[500px\]">\s*<div className="bg-white rounded-2xl border border-\[#efefef\] shadow-2xs w-full flex-1 min-h-\[500px\] relative divide-y divide-\[#efefef\] overflow-y-auto custom-scrollbar">/,
    `${standardOuter}\n      ${standardInner}`
  );
  // Clean up any remaining headers inside
  code = code.replace(
    /<div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">\s*<div>\s*<h1[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/,
    ''
  );
  return code;
});

// 3. GlobalMarket
patchFile('src/components/GlobalMarket.tsx', (code) => {
  code = code.replace(
    /<div className="relative w-full flex-1 flex flex-col min-h-\[500px\]">\s*<div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-\[#efefef\] shadow-2xs overflow-hidden w-full min-h-\[500px\] relative"/,
    `${standardOuter}\n      ${standardInner.replace(' overflow-y-auto custom-scrollbar', '')}` // GlobalMarket might need its own overflow
  );
  code = code.replace(
    /<div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-\[#efefef\] shadow-2xs overflow-hidden">/,
    `${standardOuter}\n      ${standardInner}`
  );
  return code;
});

// 4. SankeyChart - Ensure it matches exactly and remove the header title
patchFile('src/components/SankeyChart.tsx', (code) => {
  code = code.replace(
    /<div className={`bg-white p-6 rounded-2xl border border-\[#efefef\] shadow-2xs w-full \${isFullscreen \? 'max-w-7xl h-\[92vh\] overflow-hidden' : 'flex-1 min-h-\[500px\]'} flex flex-col relative`}>/,
    `<div className={\`bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full \${isFullscreen ? 'max-w-7xl h-[92vh] overflow-hidden' : 'flex-1 min-h-[500px] flex flex-col'} relative\`}>`
  );
  // Remove the redundant internal heading inside Sankey chart since the user said:
  // "remove Application Process Overview and Visualize your application pipeline from submission to outcome. only keep the same text as sankey to Overview"
  code = code.replace(
    /<div>\s*<h2 className="text-xl font-bold text-\[#121722\]">Application Process Overview<\/h2>\s*<p className="text-sm text-\[#777c86\] mt-1">Visualize your application pipeline from submission to outcome\.<\/p>\s*<\/div>/,
    ''
  );
  return code;
});

