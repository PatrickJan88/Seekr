const fs = require('fs');

// Patch NotificationCenter
let notifContent = fs.readFileSync('src/components/NotificationCenter.tsx', 'utf8');
notifContent = notifContent.replace(
  'focus:outline-none focus:ring-2 focus:ring-slate-900',
  'focus:outline-none'
);
fs.writeFileSync('src/components/NotificationCenter.tsx', notifContent);

// Patch JobForm
let jobContent = fs.readFileSync('src/components/JobForm.tsx', 'utf8');
const oldSelect = `<select name="reminder" value={formData.reminder || 'none'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm">`;
const newSelect = `<select name="reminder" value={formData.nextInterviewDate ? (formData.reminder || 'none') : 'none'} onChange={handleChange} disabled={!formData.nextInterviewDate} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">`;
jobContent = jobContent.replace(oldSelect, newSelect);
fs.writeFileSync('src/components/JobForm.tsx', jobContent);
