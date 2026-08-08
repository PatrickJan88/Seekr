const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

const oldStr = `<div className="absolute top-full left-0 right-0 mt-1 z-10">
                  <input type="datetime-local" name="customReminderDate" value={formData.customReminderDate?.slice(0, 16) || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
                </div>`;
const newStr = `<div className="mt-2">
                  <input type="datetime-local" name="customReminderDate" value={formData.customReminderDate?.slice(0, 16) || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
                </div>`;
content = content.replace(oldStr, newStr);

fs.writeFileSync('src/components/JobForm.tsx', content);
