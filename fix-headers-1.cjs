const fs = require('fs');

// EvaluateHistoryPage
let eh = fs.readFileSync('src/components/EvaluateHistoryPage.tsx', 'utf8');
eh = eh.replace(
  /<div className="w-full flex-1 max-w-5xl mx-auto flex flex-col min-h-0">[\s\S]*?<div className="bg-white rounded-2xl border border-\[#efefef\] shadow-2xs overflow-hidden flex-1 flex flex-col divide-y divide-\[#efefef\]">/,
  `<div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative divide-y divide-[#efefef] overflow-y-auto custom-scrollbar">`
);
eh = eh.replace(
  /<div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">\s*<div>\s*<h1[\s\S]*?<\/p>\s*<\/div>/,
  `<div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-end gap-4 shrink-0">`
);
// Also change the inner cards in EvaluateHistoryPage to remove bg-white and shadow
eh = eh.replaceAll('bg-white border border-[#efefef] rounded-2xl p-5 shadow-2xs', 'bg-[#faf9f7] border border-[#efefef] rounded-2xl p-5 shadow-none');
fs.writeFileSync('src/components/EvaluateHistoryPage.tsx', eh);

// SettingsPage
let st = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');
st = st.replace(
  /<div className="relative w-full flex-1 flex flex-col min-h-\[500px\]">\s*<div className="bg-white rounded-2xl border border-\[#efefef\] overflow-hidden shadow-2xs w-full flex-1 min-h-\[500px\] relative divide-y divide-\[#efefef\]">/,
  `<div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] relative divide-y divide-[#efefef] overflow-y-auto custom-scrollbar">`
);
st = st.replace(
  /<div className="flex items-center justify-between mb-8">[\s\S]*?Back to Dashboard<\/span>\s*<\/button>\s*<\/div>\s*<\/div>/,
  ''
);
st = st.replace(
  /<div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">\s*<div>\s*<h1[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/,
  ''
);
// But previously we did: `<div className="p-6">` inside SettingsPage. Let's make sure it's clean.
// Actually let's just rewrite Settings header removal more robustly.
fs.writeFileSync('src/components/SettingsPage.tsx', st);

