const fs = require('fs');

const primaryClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2";
const outlineClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2";
const destructiveClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-red-500 text-slate-50 shadow hover:bg-red-500/90 h-9 px-4 py-2";
const ghostIconClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0 text-slate-500";

let dashboard = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Settings close button
dashboard = dashboard.replace(
  'className="text-slate-400 hover:text-slate-600 transition-colors"',
  'className="' + ghostIconClass + '"'
);

// Log Out
dashboard = dashboard.replace(
  'className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"',
  'className="' + outlineClass + '"'
);

// Clear All Data
dashboard = dashboard.replace(
  'className="px-4 py-2 bg-red-600 border border-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"',
  'className="' + destructiveClass + '"'
);

// Cancel Clear Data
dashboard = dashboard.replace(
  'className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"',
  'className="' + outlineClass + '"'
);

// Confirm Clear Data
dashboard = dashboard.replace(
  'className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"',
  'className="' + destructiveClass + '"'
);

fs.writeFileSync('src/components/Dashboard.tsx', dashboard);
