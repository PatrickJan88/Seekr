const fs = require('fs');

const primaryClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2";

const outlineClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2";

// --- Dashboard.tsx ---
let dashboard = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
dashboard = dashboard.replace(
  'className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"',
  'className="' + primaryClass + ' gap-2"'
);

dashboard = dashboard.replace(
  /className=\{\`flex items-center gap-2 cursor-pointer border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold text-sm text-slate-600 transition-colors \$\{isSyncing \? 'opacity-50 cursor-not-allowed' : ''\}\`\}/g,
  'className={`cursor-pointer gap-2 ' + outlineClass + ' ${isSyncing ? "opacity-50 cursor-not-allowed" : ""}`}'
);

dashboard = dashboard.replace(
  /className=\{\`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors \$\{applications\.length === 0 \|\| isSyncing \? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 text-white'\}\`\}/,
  'className={`gap-2 ' + primaryClass + ' ${applications.length === 0 || isSyncing ? "opacity-50 cursor-not-allowed" : ""}`}'
);

dashboard = dashboard.replace(
  'className="px-6 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all flex items-center gap-2"',
  'className="' + outlineClass + ' gap-2"'
);

dashboard = dashboard.replace(
  'className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-xs font-bold uppercase"',
  'className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-red-500 text-slate-50 shadow hover:bg-red-500/90 h-9 px-4 py-2"'
);

dashboard = dashboard.replace(
  'className="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded text-xs font-bold uppercase"',
  'className="' + outlineClass + '"'
);
fs.writeFileSync('src/components/Dashboard.tsx', dashboard);

// --- JobForm.tsx ---
let jobForm = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

jobForm = jobForm.replace(
  'className="px-5 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"',
  'className="' + outlineClass + '"'
);

jobForm = jobForm.replace(
  'className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-colors"',
  'className="' + primaryClass + '"'
);

jobForm = jobForm.replace(
  /className=\{\`self-start flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-sm rounded-lg transition-colors \$\{\(isExtracting \|\| !pasteText\.trim\(\)\) \? 'opacity-50 cursor-not-allowed' : ''\}\`\}/,
  'className={`self-start gap-2 ' + outlineClass + ' ${(isExtracting || !pasteText.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}'
);

fs.writeFileSync('src/components/JobForm.tsx', jobForm);

// --- Analytics.tsx ---
let analytics = fs.readFileSync('src/components/Analytics.tsx', 'utf8');
analytics = analytics.replace(
  'className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-[42px] transition-colors"',
  'className="' + primaryClass + ' w-full md:w-auto"'
);
analytics = analytics.replace(
  'className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-auto ml-auto px-4 py-2 border border-blue-200 rounded-lg bg-blue-50"',
  'className="' + outlineClass + ' mt-auto ml-auto"'
);
fs.writeFileSync('src/components/Analytics.tsx', analytics);

